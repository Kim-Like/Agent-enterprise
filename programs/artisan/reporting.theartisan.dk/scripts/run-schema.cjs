const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const { loadEnv } = require('../config/loadEnv');
loadEnv();

function dbConfig() {
  return {
    host: process.env.ARTISAN_REPORTING_DB_HOST || '127.0.0.1',
    port: Number(process.env.ARTISAN_REPORTING_DB_PORT || 3306),
    user: process.env.ARTISAN_REPORTING_DB_USER,
    password: process.env.ARTISAN_REPORTING_DB_PASSWORD,
    database: process.env.ARTISAN_REPORTING_DB_NAME,
    multipleStatements: true,
  };
}

async function main() {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const connection = await mysql.createConnection(dbConfig());
  try {
    await connection.query(sql);
    console.log('Applied schema:', schemaPath);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Failed to apply schema:', err.message || err);
  process.exit(1);
});
