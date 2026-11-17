const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

/**
 * Pool de conexiones MySQL 8+ para la base de datos rrhh_ticotech.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'rrhh_ticotech',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '-06:00',
  decimalNumbers: true,
});

/**
 * Carga y parsea las consultas desde database/consultas.sql
 */
const SQL_FILE_PATH = path.resolve(__dirname, '../../../database/consultas.sql');
let queriesCache = null;

function loadQueries() {
  if (queriesCache) return queriesCache;

  const content = fs.readFileSync(SQL_FILE_PATH, 'utf8');
  const map = {};
  const blocks = content.split(/--\s*@name:\s*/i);

  for (let i = 1; i < blocks.length; i++) {
    const lines = blocks[i].split(/\r?\n/);
    const name = lines[0].trim();
    const sql = lines
      .slice(1)
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .trim();
    if (name && sql) {
      map[name] = sql;
    }
  }

  queriesCache = map;
  return map;
}

/**
 * Ejecuta una consulta por su nombre definido en database/consultas.sql
 * @param {string} queryName - Nombre de la consulta en database/consultas.sql
 * @param {Array} params - Parámetros para la consulta preparada
 */
async function runQuery(queryName, params = []) {
  const queries = loadQueries();
  const sql = queries[queryName];
  if (!sql) {
    throw new Error(`Consulta "${queryName}" no encontrada en database/consultas.sql`);
  }
  return pool.query(sql, params);
}

/**
 * Verifica conectividad contra MySQL.
 */
async function testConnection() {
  const [rows] = await runQuery('health_check');
  return rows[0];
}

if (require.main === module) {
  testConnection()
    .then((result) => {
      console.log('Conexión MySQL exitosa:', result);
      return pool.end();
    })
    .catch(async (error) => {
      console.error('Error al conectar a MySQL:', error.message);
      await pool.end().catch(() => {});
      process.exitCode = 1;
    });
}

module.exports = {
  pool,
  runQuery,
  testConnection,
};
