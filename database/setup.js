// database/setup.js
// Configuración inicial de la base de datos PostgreSQL

const { Pool } = require('pg');
const path = require('path');

// Configuración de conexión
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function crearBaseDatos() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Conectado a PostgreSQL');

    // Habilitar extensiones
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // TABLA: usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        telefono TEXT,
        fecha_nacimiento DATE,
        
        ahorro_actual DECIMAL(12,2) DEFAULT 0,
        meta_ahorro DECIMAL(12,2),
        meta_fecha DATE,
        tolerancia_riesgo TEXT DEFAULT 'medio',
        
        tipo_plan TEXT DEFAULT 'gratuito',
        fecha_premium TIMESTAMP,
        
        referido_por TEXT,
        codigo_referido TEXT UNIQUE,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultimo_acceso TIMESTAMP,
        
        email_verificado BOOLEAN DEFAULT FALSE,
        activo BOOLEAN DEFAULT TRUE
      )
    `);
    console.log('✅ Tabla usuarios creada');

    // TABLA: opciones_inversion
    await client.query(`
      CREATE TABLE IF NOT EXISTS opciones_inversion (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL,
        institucion TEXT NOT NULL,
        
        tasa_anual DECIMAL(5,2) NOT NULL,
        tasa_mensual DECIMAL(5,2),
        
        monto_minimo DECIMAL(12,2) DEFAULT 0,
        plazo_minimo_dias INTEGER DEFAULT 0,
        
        nivel_riesgo TEXT DEFAULT 'bajo',
        liquidez TEXT DEFAULT 'alta',
        descripcion TEXT,
        
        comision_apertura DECIMAL(5,2) DEFAULT 0,
        comision_manejo DECIMAL(5,2) DEFAULT 0,
        
        url_afiliado TEXT,
        comision_referido DECIMAL(8,2) DEFAULT 0,
        
        logo_url TEXT,
        destacado BOOLEAN DEFAULT FALSE,
        activo BOOLEAN DEFAULT TRUE,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla opciones_inversion creada');

    // TABLA: conversiones
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversiones (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        opcion_id INTEGER NOT NULL REFERENCES opciones_inversion(id),
        
        monto_invertido DECIMAL(12,2),
        fecha_click TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_conversion TIMESTAMP,
        
        comision_ganada DECIMAL(8,2) DEFAULT 0,
        estado TEXT DEFAULT 'pendiente',
        
        ip_address TEXT,
        user_agent TEXT
      )
    `);
    console.log('✅ Tabla conversiones creada');

    // TABLA: metas_ahorro
    await client.query(`
      CREATE TABLE IF NOT EXISTS metas_ahorro (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        
        nombre TEXT NOT NULL,
        descripcion TEXT,
        monto_objetivo DECIMAL(12,2) NOT NULL,
        monto_actual DECIMAL(12,2) DEFAULT 0,
        fecha_objetivo DATE,
        
        aporte_mensual DECIMAL(12,2),
        opcion_inversion_id INTEGER REFERENCES opciones_inversion(id),
        
        completada BOOLEAN DEFAULT FALSE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_completada TIMESTAMP
      )
    `);
    console.log('✅ Tabla metas_ahorro creada');

    // TABLA: notificaciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        
        tipo TEXT NOT NULL,
        titulo TEXT NOT NULL,
        mensaje TEXT NOT NULL,
        
        leida BOOLEAN DEFAULT FALSE,
        fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_lectura TIMESTAMP,
        
        link TEXT,
        icono TEXT
      )
    `);
    console.log('✅ Tabla notificaciones creada');

    // TABLA: pagos_premium
    await client.query(`
      CREATE TABLE IF NOT EXISTS pagos_premium (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        
        monto DECIMAL(8,2) NOT NULL,
        tipo_plan TEXT NOT NULL,
        periodo TEXT NOT NULL,
        
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        metodo_pago TEXT,
        referencia_pago TEXT,
        estado TEXT DEFAULT 'completado'
      )
    `);
    console.log('✅ Tabla pagos_premium creada');

    console.log('✅ Base de datos PostgreSQL creada exitosamente');
    
  } catch (error) {
    console.error('❌ Error creando base de datos:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function insertarDatosIniciales() {
  const client = await pool.connect();
  
  try {
    // Verificar si ya hay opciones
    const { rows } = await client.query('SELECT COUNT(*) FROM opciones_inversion');
    if (parseInt(rows[0].count) > 0) {
      console.log('ℹ️  Datos iniciales ya existen, omitiendo inserción');
      return;
    }

    const opciones = [
      {
        nombre: 'CETES 28 días',
        tipo: 'Gubernamental',
        institucion: 'CetesDirecto',
        tasa_anual: 11.25,
        tasa_mensual: 0.94,
        monto_minimo: 100,
        plazo_minimo_dias: 28,
        nivel_riesgo: 'muy_bajo',
        liquidez: 'alta',
        descripcion: 'Certificados de la Tesorería. La inversión más segura en México, respaldada por el gobierno.',
        url_afiliado: 'https://www.cetesdirecto.com/',
        comision_referido: 0,
        logo_url: 'https://www.cetesdirecto.com/assets/img/logo.png',
        destacado: true
      },
      {
        nombre: 'Hey Banco',
        tipo: 'Cuenta de ahorro',
        institucion: 'Hey Banco',
        tasa_anual: 15.0,
        tasa_mensual: 1.25,
        monto_minimo: 1,
        plazo_minimo_dias: 0,
        nivel_riesgo: 'bajo',
        liquidez: 'inmediata',
        descripcion: 'Cuenta digital con rendimientos diarios. Retira tu dinero cuando quieras sin penalización.',
        url_afiliado: 'https://www.heybanco.com/?ref=',
        comision_referido: 100,
        logo_url: 'https://www.heybanco.com/assets/logo.svg',
        destacado: true
      },
      {
        nombre: 'GBM+ Smart Cash',
        tipo: 'Fondo de inversión',
        institucion: 'GBM+',
        tasa_anual: 12.8,
        tasa_mensual: 1.07,
        monto_minimo: 1000,
        plazo_minimo_dias: 0,
        nivel_riesgo: 'bajo',
        liquidez: 'alta',
        descripcion: 'Fondo de deuda gubernamental. Gestionado profesionalmente con rendimientos competitivos.',
        url_afiliado: 'https://gbm.com/registro?ref=',
        comision_referido: 200,
        logo_url: 'https://gbm.com/assets/logo.png',
        destacado: false
      },
      {
        nombre: 'Kuspit Diversificado',
        tipo: 'Fondo de inversión',
        institucion: 'Kuspit',
        tasa_anual: 18.0,
        tasa_mensual: 1.5,
        monto_minimo: 100,
        plazo_minimo_dias: 0,
        nivel_riesgo: 'medio',
        liquidez: 'media',
        descripcion: 'Cartera diversificada con instrumentos de deuda y renta variable. Mayor rendimiento, riesgo controlado.',
        url_afiliado: 'https://kuspit.com/registro?ref=',
        comision_referido: 150,
        logo_url: 'https://kuspit.com/assets/logo.svg',
        destacado: true
      },
      {
        nombre: 'Nu Cuenta',
        tipo: 'Cuenta de ahorro',
        institucion: 'Nu México',
        tasa_anual: 14.5,
        tasa_mensual: 1.21,
        monto_minimo: 1,
        plazo_minimo_dias: 0,
        nivel_riesgo: 'bajo',
        liquidez: 'inmediata',
        descripcion: 'Cuenta con rendimientos automáticos. Sin comisiones, 100% digital.',
        url_afiliado: 'https://nu.com.mx/?ref=',
        comision_referido: 50,
        logo_url: 'https://nu.com.mx/images/nu-logo.svg',
        destacado: false
      }
    ];

    for (const opcion of opciones) {
      await client.query(`
        INSERT INTO opciones_inversion 
        (nombre, tipo, institucion, tasa_anual, tasa_mensual, monto_minimo, 
         plazo_minimo_dias, nivel_riesgo, liquidez, descripcion, 
         url_afiliado, comision_referido, logo_url, destacado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT DO NOTHING
      `, [
        opcion.nombre, opcion.tipo, opcion.institucion, opcion.tasa_anual,
        opcion.tasa_mensual, opcion.monto_minimo, opcion.plazo_minimo_dias,
        opcion.nivel_riesgo, opcion.liquidez, opcion.descripcion,
        opcion.url_afiliado, opcion.comision_referido, opcion.logo_url,
        opcion.destacado
      ]);
    }

    console.log('✅ Datos iniciales insertados');
    
  } catch (error) {
    console.error('❌ Error insertando datos:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar setup
if (require.main === module) {
  console.log('🚀 Configurando base de datos PostgreSQL...\n');
  
  crearBaseDatos()
    .then(() => insertarDatosIniciales())
    .then(() => {
      console.log('\n✅ Setup completado');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error en setup:', err);
      process.exit(1);
    });
}

module.exports = { crearBaseDatos, insertarDatosIniciales, pool };