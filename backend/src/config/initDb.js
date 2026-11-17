const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

/**
 * Script para inicializar la base de datos rrhh_ticotech ejecutando el archivo SQL.
 */
async function initDatabase() {
  const candidates = [
    path.resolve(__dirname, '../../../database/rrhh_ticotech.sql'),
    path.resolve(__dirname, '../../database/rrhh_ticotech.sql'),
    path.resolve(__dirname, '../../rrhh_ticotech.sql'),
  ];
  const sqlPath = candidates.find((p) => fs.existsSync(p));
  if (!sqlPath) {
    throw new Error(`No se encontró el archivo SQL en ninguna de las rutas esperadas:\n${candidates.join('\n')}`);
  }

  console.log('📖 Leyendo archivo SQL...');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log(`🔌 Conectando a MySQL en ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}...`);
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    console.log('⚙️ Ejecutando DDL y DML (22 tablas e inserciones simuladas)...');
    await connection.query(sql);
    console.log('✅ ¡Base de datos rrhh_ticotech inicializada con éxito!');

    // Verificar conteo de tablas
    const [rows] = await connection.query(`
      SELECT count(*) AS total_tablas 
      FROM information_schema.tables 
      WHERE table_schema = 'rrhh_ticotech'
    `);
    console.log(`📊 Total de tablas creadas: ${rows[0].total_tablas}`);
  } finally {
    await connection.end();
  }
}

initDatabase().catch((err) => {
  console.error('❌ Error al inicializar la base de datos:', err.message);
  process.exit(1);
});
