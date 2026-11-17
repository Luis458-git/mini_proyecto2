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
 * Verifica conectividad contra MySQL y devuelve la base de datos activa.
 * @returns {Promise<{ok: number, db: string}>}
 */
async function testConnection() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT 1 AS ok, DATABASE() AS db');
    return rows[0];
  } finally {
    connection.release();
  }
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
  testConnection,
};
