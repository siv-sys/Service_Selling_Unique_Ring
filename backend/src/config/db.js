<<<<<<< HEAD
﻿
const mysql = require('mysql2/promise');
=======
﻿const mysql = require('mysql2/promise');
>>>>>>> ef5cde89b20e9ceeecbac3d8171cd2af67dcf559
const env = require('./env');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  namedPlaceholders: true,
});

<<<<<<< HEAD
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
=======
async function query(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
>>>>>>> ef5cde89b20e9ceeecbac3d8171cd2af67dcf559
  return rows;
}

async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

<<<<<<< HEAD
module.exports = {
  pool,
  query,
  execute,
  ping,
};
=======
module.exports = { pool, query, ping };
>>>>>>> ef5cde89b20e9ceeecbac3d8171cd2af67dcf559
