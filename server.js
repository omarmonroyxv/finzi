// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ============================================
// FUNCIONES DE BASE DE DATOS (PostgreSQL)
// ============================================

async function dbRun(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return { 
      id: result.rows[0]?.id, 
      changes: result.rowCount 
    };
  } finally {
    client.release();
  }
}

async function dbGet(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

async function dbAll(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================

function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token no proporcionado' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
}

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

// Registro de usuario
app.post('/api/auth/registro', async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;
    
    // Validaciones básicas
    if (!nombre || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos requeridos' 
      });
    }
    
    // Verificar si el email ya existe
    const existente = await dbGet(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );
    
    if (existente) {
      return res.status(400).json({ 
        success: false, 
        message: 'El email ya está registrado' 
      });
    }
    
    // Hash del password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generar código de referido único
    const codigoReferido = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Insertar usuario
    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, telefono, codigo_referido, fecha_registro)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id`,
      [nombre, email, passwordHash, telefono || null, codigoReferido]
    );
    
    const userId = resultado.rows[0].id;
    
    // Generar token JWT
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        userId,
        nombre,
        email,
        token
      }
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar usuario',
      error: error.message 
    });
  }
});

// Login de usuario
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email y contraseña requeridos' 
      });
    }
    
    // Buscar usuario
    const usuario = await dbGet(
      'SELECT id, nombre, email, password_hash, tipo_plan FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    );
    
    if (!usuario) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }
    
    // Verificar password
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    
    if (!passwordValido) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }
    
    // Actualizar último acceso
    await dbRun(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
      [usuario.id]
    );
    
    // Generar token
    const token = jwt.sign(
      { userId: usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        userId: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        tipoPlan: usuario.tipo_plan,
        token
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al iniciar sesión' 
    });
  }
});

// ============================================
// RUTAS DE OPCIONES DE INVERSIÓN
// ============================================

// Obtener todas las opciones de inversión
app.get('/api/opciones', async (req, res) => {
  try {
    const opciones = await dbAll(
      `SELECT * FROM opciones_inversion 
       WHERE activo = true 
       ORDER BY destacado DESC, tasa_anual DESC`
    );
    
    res.json({
      success: true,
      count: opciones.length,
      data: opciones
    });
    
  } catch (error) {
    console.error('Error obteniendo opciones:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener opciones' 
    });
  }
});

// Obtener una opción específica
app.get('/api/opciones/:id', async (req, res) => {
  try {
    const opcion = await dbGet(
      'SELECT * FROM opciones_inversion WHERE id = $1 AND activo = true',
      [req.params.id]
    );
    
    if (!opcion) {
      return res.status(404).json({ 
        success: false, 
        message: 'Opción no encontrada' 
      });
    }
    
    res.json({
      success: true,
      data: opcion
    });
    
  } catch (error) {
    console.error('Error obteniendo opción:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener opción' 
    });
  }
});

// ============================================
// RUTAS DE CÁLCULOS
// ============================================

// Calcular proyección de inversión
app.post('/api/calcular/proyeccion', (req, res) => {
  try {
    const { 
      montoInicial, 
      aportesMensuales, 
      tasaAnual, 
      meses 
    } = req.body;
    
    if (!montoInicial || !tasaAnual || !meses) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan parámetros requeridos' 
      });
    }
    
    const tasaMensual = tasaAnual / 100 / 12;
    const aportes = aportesMensuales || 0;
    
    let proyeccion = [];
    let saldo = parseFloat(montoInicial);
    let totalAportado = saldo;
    let totalIntereses = 0;
    
    for (let mes = 1; mes <= meses; mes++) {
      const interesesMes = saldo * tasaMensual;
      saldo += interesesMes + aportes;
      totalAportado += aportes;
      totalIntereses += interesesMes;
      
      proyeccion.push({
        mes,
        saldo: Math.round(saldo * 100) / 100,
        interesesMes: Math.round(interesesMes * 100) / 100,
        aporteMes: aportes
      });
    }
    
    res.json({
      success: true,
      data: {
        montoFinal: Math.round(saldo * 100) / 100,
        totalAportado: Math.round(totalAportado * 100) / 100,
        totalIntereses: Math.round(totalIntereses * 100) / 100,
        rendimientoTotal: Math.round((totalIntereses / totalAportado) * 10000) / 100,
        proyeccionMensual: proyeccion
      }
    });
    
  } catch (error) {
    console.error('Error en cálculo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al calcular proyección' 
    });
  }
});

// Calcular plan personalizado
app.post('/api/calcular/plan', verificarToken, async (req, res) => {
  try {
    const { 
      montoActual, 
      montoMeta, 
      mesesPlazo,
      toleranciaRiesgo 
    } = req.body;
    
    if (!montoActual || !montoMeta || !mesesPlazo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan parámetros requeridos' 
      });
    }
    
    // Obtener opciones según tolerancia al riesgo
    let filtroRiesgo = '';
    if (toleranciaRiesgo === 'bajo') {
      filtroRiesgo = "AND nivel_riesgo IN ('muy_bajo', 'bajo')";
    } else if (toleranciaRiesgo === 'medio') {
      filtroRiesgo = "AND nivel_riesgo IN ('bajo', 'medio')";
    }
    
    const opciones = await dbAll(
      `SELECT * FROM opciones_inversion 
       WHERE activo = true ${filtroRiesgo}
       ORDER BY tasa_anual DESC
       LIMIT 3`
    );
    
    const planes = opciones.map(opcion => {
      const tasaMensual = opcion.tasa_anual / 100 / 12;
      let saldo = parseFloat(montoActual);
      const diferencia = montoMeta - montoActual;
      
      // Calcular aporte mensual necesario
      let aporteNecesario = 0;
      
      if (saldo < montoMeta) {
        const factorInteres = Math.pow(1 + tasaMensual, mesesPlazo);
        const valorFuturoInicial = saldo * factorInteres;
        
        if (valorFuturoInicial < montoMeta) {
          const diferenciaConInteres = montoMeta - valorFuturoInicial;
          aporteNecesario = diferenciaConInteres / (((factorInteres - 1) / tasaMensual));
        }
      }
      
      // Calcular monto final con esos aportes
      saldo = parseFloat(montoActual);
      for (let i = 0; i < mesesPlazo; i++) {
        saldo = (saldo + aporteNecesario) * (1 + tasaMensual);
      }
      
      return {
        opcionId: opcion.id,
        nombre: opcion.nombre,
        institucion: opcion.institucion,
        tasaAnual: opcion.tasa_anual,
        nivelRiesgo: opcion.nivel_riesgo,
        aportesMensuales: Math.ceil(aporteNecesario),
        montoFinal: Math.round(saldo * 100) / 100,
        alcanzaMeta: saldo >= montoMeta,
        excedente: Math.round((saldo - montoMeta) * 100) / 100
      };
    });
    
    res.json({
      success: true,
      data: {
        montoActual,
        montoMeta,
        mesesPlazo,
        planes
      }
    });
    
  } catch (error) {
    console.error('Error calculando plan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al calcular plan personalizado' 
    });
  }
});

// ============================================
// RUTAS DE PERFIL DE USUARIO
// ============================================

// Obtener perfil de usuario
app.get('/api/usuario/perfil', verificarToken, async (req, res) => {
  try {
    const usuario = await dbGet(
      `SELECT id, nombre, email, telefono, fecha_nacimiento,
              ahorro_actual, meta_ahorro, meta_fecha,
              tolerancia_riesgo, tipo_plan, codigo_referido,
              fecha_registro
       FROM usuarios WHERE id = $1`,
      [req.userId]
    );
    
    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Obtener estadísticas del usuario
    const stats = await dbGet(
      `SELECT 
        COUNT(*) as total_conversiones,
        SUM(CASE WHEN estado = 'completado' THEN comision_ganada ELSE 0 END) as total_ganado
       FROM conversiones WHERE usuario_id = $1`,
      [req.userId]
    );
    
    res.json({
      success: true,
      data: {
        ...usuario,
        estadisticas: stats || { total_conversiones: 0, total_ganado: 0 }
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener perfil' 
    });
  }
});

// Actualizar perfil de usuario
app.put('/api/usuario/perfil', verificarToken, async (req, res) => {
  try {
    const {
      nombre,
      telefono,
      fecha_nacimiento,
      ahorro_actual,
      meta_ahorro,
      meta_fecha,
      tolerancia_riesgo
    } = req.body;
    
    await dbRun(
      `UPDATE usuarios SET
        nombre = COALESCE($1, nombre),
        telefono = COALESCE($2, telefono),
        fecha_nacimiento = COALESCE($3, fecha_nacimiento),
        ahorro_actual = COALESCE($4, ahorro_actual),
        meta_ahorro = COALESCE($5, meta_ahorro),
        meta_fecha = COALESCE($6, meta_fecha),
        tolerancia_riesgo = COALESCE($7, tolerancia_riesgo)
       WHERE id = $8`,
      [nombre, telefono, fecha_nacimiento, ahorro_actual, 
       meta_ahorro, meta_fecha, tolerancia_riesgo, req.userId]
    );
    
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar perfil' 
    });
  }
});

// ============================================
// RUTAS DE TRACKING (CONVERSIONES)
// ============================================

// Registrar click en enlace de afiliado
app.post('/api/tracking/click', verificarToken, async (req, res) => {
  try {
    const { opcionId, montoEstimado } = req.body;
    
    if (!opcionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'opcionId requerido' 
      });
    }
    
    // Obtener datos de la opción
    const opcion = await dbGet(
      'SELECT * FROM opciones_inversion WHERE id = $1',
      [opcionId]
    );
    
    if (!opcion) {
      return res.status(404).json({ 
        success: false, 
        message: 'Opción no encontrada' 
      });
    }
    
    // Registrar la conversión
    const resultado = await pool.query(
      `INSERT INTO conversiones 
       (usuario_id, opcion_id, monto_invertido, estado, ip_address, user_agent)
       VALUES ($1, $2, $3, 'click', $4, $5)
       RETURNING id`,
      [
        req.userId,
        opcionId,
        montoEstimado || null,
        req.ip,
        req.headers['user-agent']
      ]
    );
    
    const conversionId = resultado.rows[0].id;
    
    // Generar URL de afiliado personalizada
    const urlAfiliado = `${opcion.url_afiliado}${opcion.institucion.toLowerCase()}_${req.userId}_${conversionId}`;
    
    res.json({
      success: true,
      message: 'Click registrado',
      data: {
        conversionId,
        urlAfiliado
      }
    });
    
  } catch (error) {
    console.error('Error registrando click:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar click' 
    });
  }
});

// ============================================
// RUTAS DE METAS DE AHORRO
// ============================================

// Obtener todas las metas del usuario
app.get('/api/usuario/metas', verificarToken, async (req, res) => {
  try {
    const metas = await dbAll(
      `SELECT * FROM metas_ahorro 
       WHERE usuario_id = $1 
       ORDER BY fecha_creacion DESC`,
      [req.userId]
    );
    
    res.json({
      success: true,
      count: metas.length,
      data: metas
    });
    
  } catch (error) {
    console.error('Error obteniendo metas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener metas' 
    });
  }
});

// Crear nueva meta
app.post('/api/usuario/metas', verificarToken, async (req, res) => {
  try {
    const { 
      nombre, 
      descripcion,
      monto_objetivo, 
      fecha_objetivo,
      aporte_mensual,
      opcion_inversion_id 
    } = req.body;
    
    // Validaciones
    if (!nombre || !monto_objetivo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre y monto objetivo son requeridos' 
      });
    }
    
    // Insertar meta
    const resultado = await pool.query(
      `INSERT INTO metas_ahorro 
       (usuario_id, nombre, descripcion, monto_objetivo, fecha_objetivo, 
        aporte_mensual, opcion_inversion_id, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        req.userId, 
        nombre, 
        descripcion || null,
        monto_objetivo, 
        fecha_objetivo || null,
        aporte_mensual || 0,
        opcion_inversion_id || null
      ]
    );
    
    res.json({
      success: true,
      message: 'Meta creada exitosamente',
      data: resultado.rows[0]
    });
    
  } catch (error) {
    console.error('Error creando meta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear meta',
      error: error.message 
    });
  }
});

// Actualizar una meta
app.put('/api/usuario/metas/:id', verificarToken, async (req, res) => {
  try {
    const metaId = req.params.id;
    const { 
      nombre, 
      descripcion,
      monto_objetivo,
      monto_actual,
      fecha_objetivo,
      aporte_mensual,
      completada 
    } = req.body;
    
    // Verificar que la meta pertenece al usuario
    const metaExistente = await dbGet(
      'SELECT id FROM metas_ahorro WHERE id = $1 AND usuario_id = $2',
      [metaId, req.userId]
    );
    
    if (!metaExistente) {
      return res.status(404).json({ 
        success: false, 
        message: 'Meta no encontrada' 
      });
    }
    
    // Actualizar meta
    await pool.query(
      `UPDATE metas_ahorro SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        monto_objetivo = COALESCE($3, monto_objetivo),
        monto_actual = COALESCE($4, monto_actual),
        fecha_objetivo = COALESCE($5, fecha_objetivo),
        aporte_mensual = COALESCE($6, aporte_mensual),
        completada = COALESCE($7, completada),
        fecha_completada = CASE 
          WHEN $7 = true AND completada = false THEN CURRENT_TIMESTAMP 
          ELSE fecha_completada 
        END
       WHERE id = $8 AND usuario_id = $9`,
      [
        nombre, descripcion, monto_objetivo, monto_actual,
        fecha_objetivo, aporte_mensual, completada,
        metaId, req.userId
      ]
    );
    
    // Obtener meta actualizada
    const metaActualizada = await dbGet(
      'SELECT * FROM metas_ahorro WHERE id = $1',
      [metaId]
    );
    
    res.json({
      success: true,
      message: 'Meta actualizada exitosamente',
      data: metaActualizada
    });
    
  } catch (error) {
    console.error('Error actualizando meta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar meta' 
    });
  }
});

// Eliminar una meta
app.delete('/api/usuario/metas/:id', verificarToken, async (req, res) => {
  try {
    const metaId = req.params.id;
    
    // Verificar que la meta pertenece al usuario
    const metaExistente = await dbGet(
      'SELECT id FROM metas_ahorro WHERE id = $1 AND usuario_id = $2',
      [metaId, req.userId]
    );
    
    if (!metaExistente) {
      return res.status(404).json({ 
        success: false, 
        message: 'Meta no encontrada' 
      });
    }
    
    // Eliminar meta
    await pool.query(
      'DELETE FROM metas_ahorro WHERE id = $1 AND usuario_id = $2',
      [metaId, req.userId]
    );
    
    res.json({
      success: true,
      message: 'Meta eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando meta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar meta' 
    });
  }
});

// ============================================
// RUTAS DE SALUD Y ESTADÍSTICAS
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Finzi API funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/stats', async (req, res) => {
  try {
    const totalUsuarios = await dbGet('SELECT COUNT(*) as count FROM usuarios');
    const totalOpciones = await dbGet('SELECT COUNT(*) as count FROM opciones_inversion WHERE activo = true');
    const totalConversiones = await dbGet('SELECT COUNT(*) as count FROM conversiones');
    
    res.json({
      success: true,
      data: {
        totalUsuarios: totalUsuarios.count,
        totalOpciones: totalOpciones.count,
        totalConversiones: totalConversiones.count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo stats' });
  }
});

// ============================================
// RUTA PRINCIPAL (HTML)
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 FINZI - Servidor Backend Iniciado');
  console.log('='.repeat(60));
  console.log(`\n📡 Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`📊 API disponible en: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Base de datos: PostgreSQL`);
  console.log(`\n⚠️  Presiona Ctrl+C para detener el servidor\n`);
  console.log('='.repeat(60) + '\n');
});