const mysql = require('mysql2/promise');

function getDbConfig() {
  return {
    host: process.env.ARTISAN_REPORTING_DB_HOST || '127.0.0.1',
    port: Number(process.env.ARTISAN_REPORTING_DB_PORT || 3306),
    user: process.env.ARTISAN_REPORTING_DB_USER,
    password: process.env.ARTISAN_REPORTING_DB_PASSWORD,
    database: process.env.ARTISAN_REPORTING_DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  };
}

const pool = mysql.createPool(getDbConfig());

async function pingDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return {
      ok: true,
      host: process.env.ARTISAN_REPORTING_DB_HOST || '127.0.0.1',
      port: Number(process.env.ARTISAN_REPORTING_DB_PORT || 3306),
      database: process.env.ARTISAN_REPORTING_DB_NAME || '',
    };
  } finally {
    connection.release();
  }
}

module.exports = {
  getDbConfig,
  pool,
  pingDatabase,
};
