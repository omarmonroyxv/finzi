// database/setup.js
// Configuración inicial de la base de datos SQLite

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'finzi.db');

function crearBaseDatos() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error conectando a la base de datos:', err);
        reject(err);
        return;
      }
      console.log('✅ Conectado a SQLite');
    });

    // Habilitar foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // TABLA: usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        telefono TEXT,
        fecha_nacimiento DATE,
        
        -- Datos financieros
        ahorro_actual REAL DEFAULT 0,
        meta_ahorro REAL,
        meta_fecha DATE,
        tolerancia_riesgo TEXT DEFAULT 'medio',
        
        -- Membresía
        tipo_plan TEXT DEFAULT 'gratuito',
        fecha_premium DATE,
        
        -- Tracking
        referido_por TEXT,
        codigo_referido TEXT UNIQUE,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultimo_acceso DATETIME,
        
        -- Estado
        email_verificado INTEGER DEFAULT 0,
        activo INTEGER DEFAULT 1
      )
    `, (err) => {
      if (err) console.error('Error creando tabla usuarios:', err);
    });

    // TABLA: opciones_inversion
    db.run(`
      CREATE TABLE IF NOT EXISTS opciones_inversion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL,
        institucion TEXT NOT NULL,
        
        -- Rendimientos
        tasa_anual REAL NOT NULL,
        tasa_mensual REAL,
        
        -- Requisitos
        monto_minimo REAL DEFAULT 0,
        plazo_minimo_dias INTEGER DEFAULT 0,
        
        -- Características
        nivel_riesgo TEXT DEFAULT 'bajo',
        liquidez TEXT DEFAULT 'alta',
        descripcion TEXT,
        
        -- Comisiones
        comision_apertura REAL DEFAULT 0,
        comision_manejo REAL DEFAULT 0,
        
        -- Afiliado
        url_afiliado TEXT,
        comision_referido REAL DEFAULT 0,
        
        -- Metadata
        logo_url TEXT,
        destacado INTEGER DEFAULT 0,
        activo INTEGER DEFAULT 1,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creando tabla opciones_inversion:', err);
    });

    // TABLA: conversiones (tracking de referidos)
    db.run(`
      CREATE TABLE IF NOT EXISTS conversiones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        opcion_id INTEGER NOT NULL,
        
        -- Datos de la conversión
        monto_invertido REAL,
        fecha_click DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_conversion DATETIME,
        
        -- Comisión
        comision_ganada REAL DEFAULT 0,
        estado TEXT DEFAULT 'pendiente',
        
        -- Metadata
        ip_address TEXT,
        user_agent TEXT,
        
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
        FOREIGN KEY (opcion_id) REFERENCES opciones_inversion (id)
      )
    `, (err) => {
      if (err) console.error('Error creando tabla conversiones:', err);
    });

    // TABLA: metas_ahorro
    db.run(`
      CREATE TABLE IF NOT EXISTS metas_ahorro (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        
        -- Detalles de la meta
        nombre TEXT NOT NULL,
        descripcion TEXT,
        monto_objetivo REAL NOT NULL,
        monto_actual REAL DEFAULT 0,
        fecha_objetivo DATE,
        
        -- Estrategia
        aporte_mensual REAL,
        opcion_inversion_id INTEGER,
        
        -- Estado
        completada INTEGER DEFAULT 0,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_completada DATETIME,
        
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
        FOREIGN KEY (opcion_inversion_id) REFERENCES opciones_inversion (id)
      )
    `, (err) => {
      if (err) console.error('Error creando tabla metas_ahorro:', err);
    });

    // TABLA: notificaciones
    db.run(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        
        -- Contenido
        tipo TEXT NOT NULL,
        titulo TEXT NOT NULL,
        mensaje TEXT NOT NULL,
        
        -- Estado
        leida INTEGER DEFAULT 0,
        fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_lectura DATETIME,
        
        -- Metadata
        link TEXT,
        icono TEXT,
        
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )
    `, (err) => {
      if (err) console.error('Error creando tabla notificaciones:', err);
    });

    // TABLA: pagos_premium (para membresías)
    db.run(`
      CREATE TABLE IF NOT EXISTS pagos_premium (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        
        -- Detalles del pago
        monto REAL NOT NULL,
        tipo_plan TEXT NOT NULL,
        periodo TEXT NOT NULL,
        
        -- Fechas
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Pago
        metodo_pago TEXT,
        referencia_pago TEXT,
        estado TEXT DEFAULT 'completado',
        
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )
    `, (err) => {
      if (err) console.error('Error creando tabla pagos_premium:', err);
      
      // Cerrar conexión después de crear todas las tablas
      db.close((err) => {
        if (err) {
          console.error('Error cerrando la base de datos:', err);
          reject(err);
        } else {
          console.log('✅ Base de datos creada exitosamente');
          resolve();
        }
      });
    });
  });
}

// Insertar datos iniciales de opciones de inversión
function insertarDatosIniciales() {
  const db = new sqlite3.Database(DB_PATH);
  
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
      destacado: 1
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
      destacado: 1
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
      destacado: 0
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
      destacado: 1
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
      destacado: 0
    }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO opciones_inversion 
    (nombre, tipo, institucion, tasa_anual, tasa_mensual, monto_minimo, 
     plazo_minimo_dias, nivel_riesgo, liquidez, descripcion, 
     url_afiliado, comision_referido, logo_url, destacado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  opciones.forEach(opcion => {
    stmt.run(
      opcion.nombre, opcion.tipo, opcion.institucion, opcion.tasa_anual,
      opcion.tasa_mensual, opcion.monto_minimo, opcion.plazo_minimo_dias,
      opcion.nivel_riesgo, opcion.liquidez, opcion.descripcion,
      opcion.url_afiliado, opcion.comision_referido, opcion.logo_url,
      opcion.destacado
    );
  });

  stmt.finalize();
  db.close();
  
  console.log('✅ Datos iniciales insertados');
}

// Ejecutar setup
if (require.main === module) {
  console.log('🚀 Configurando base de datos...\n');
  
  crearBaseDatos()
    .then(() => {
      insertarDatosIniciales();
      console.log('\n✅ Setup completado');
      console.log('📊 Base de datos lista en: database/finzi.db');
    })
    .catch(err => {
      console.error('❌ Error en setup:', err);
      process.exit(1);
    });
}

module.exports = { crearBaseDatos, insertarDatosIniciales };