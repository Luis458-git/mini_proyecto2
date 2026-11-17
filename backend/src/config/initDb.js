const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

/**
 * Script nativo con mysql2/promise (sin ORM) para inicializar la base de datos ejecutando el archivo SQL.
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

  const dbName = process.env.DB_NAME || 'rrhh_ticotech';
  console.log(`📖 Leyendo archivo SQL para la base de datos "${dbName}"...`);
  let sql = fs.readFileSync(sqlPath, 'utf8');

  // Adaptar el nombre de la base de datos al configurado en .env
  if (dbName !== 'rrhh_ticotech') {
    sql = sql.replace(/rrhh_ticotech/g, dbName);
  }

  console.log(`🔌 Conectando a MySQL en ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}...`);
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    console.log('⚙️ Ejecutando DDL y DML con mysql2 nativo (22 tablas y 50 colaboradores)...');
    await connection.query(sql);
    console.log(`✅ ¡Base de datos "${dbName}" inicializada con éxito (100% SQL nativo, cero ORM)!`);

    // Verificar conteo de tablas
    const [rows] = await connection.query(
      `SELECT count(*) AS total_tablas FROM information_schema.tables WHERE table_schema = ?`,
      [dbName]
    );
    console.log(`📊 Total de tablas creadas en "${dbName}": ${rows[0].total_tablas}`);
  } finally {
    await connection.end();
  }
}

initDatabase().catch((err) => {
  console.error('❌ Error al inicializar la base de datos:', err.message);
  process.exit(1);
});
