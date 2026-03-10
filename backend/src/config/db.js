
const mysql = require('mysql2/promise');
<<<<<<< HEAD
const { env } = require('./env.js');
=======
const env = require('./env');
>>>>>>> feature/ringInventory

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
<<<<<<< HEAD
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
=======
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
<<<<<<< HEAD
>>>>>>> feature/ringInventory
  namedPlaceholders: true,
});

async function query(sql, params = {}) {
<<<<<<< HEAD
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function execute(sql, params = {}) {
  const [result] = await pool.execute(sql, params);
  return result;
}

module.exports = { pool, query, execute };
=======
  const [rows] = await pool.execute(sql, params);
=======
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
>>>>>>> feature/admin_dashboard
  return rows;
}

async function ping() {
<<<<<<< HEAD
  await pool.query('SELECT 1');
=======
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
>>>>>>> feature/admin_dashboard
}

module.exports = {
  pool,
  query,
  ping,
};
>>>>>>> feature/ringInventory
