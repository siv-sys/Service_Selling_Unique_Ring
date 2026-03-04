
const mysql = require('mysql2/promise');
const { env } = require('./env.js');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  namedPlaceholders: true,
});

async function query(sql, params = {}) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function execute(sql, params = {}) {
  const [result] = await pool.execute(sql, params);
  return result;
}

module.exports = { pool, query, execute };
