const mysql = require('mysql2/promise');

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getFirstEnv(names) {
  return names.map((name) => process.env[name]).find(Boolean);
}

function hasDatabaseEnv() {
  return Boolean(getFirstEnv([
    'MYSQL_URL',
    'MYSQL_PUBLIC_URL',
    'MYSQL_PRIVATE_URL',
    'DATABASE_URL',
    'DATABASE_PUBLIC_URL',
    'DATABASE_PRIVATE_URL',
    'MYSQLHOST',
    'DB_HOST'
  ]));
}

function parseDatabaseUrl(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  const url = new URL(rawUrl);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database
  };
}

function getDatabaseConfig() {
  const urlConfig = parseDatabaseUrl(getFirstEnv([
    'MYSQL_URL',
    'MYSQL_PUBLIC_URL',
    'MYSQL_PRIVATE_URL',
    'DATABASE_URL',
    'DATABASE_PUBLIC_URL',
    'DATABASE_PRIVATE_URL'
  ]));

  return {
    host: process.env.MYSQLHOST || urlConfig?.host || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.MYSQLPORT || urlConfig?.port || process.env.DB_PORT || 3306),
    user: process.env.MYSQLUSER || urlConfig?.user || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || urlConfig?.password || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || urlConfig?.database || process.env.DB_NAME || 'cashflow_harian',
    waitForConnections: true,
    connectionLimit: numberFromEnv('DB_CONNECTION_LIMIT', 10),
    queueLimit: 0,
    decimalNumbers: true,
    dateStrings: true
  };
}

const pool = mysql.createPool(getDatabaseConfig());

async function assertDatabaseConnection() {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

module.exports = {
  assertDatabaseConnection,
  getDatabaseConfig,
  hasDatabaseEnv,
  pool
};
