
const mysql = require('mysql2/promise');
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
<<<<<<< HEAD
  namedPlaceholders: true,
});

async function query(sql, params = {}) {
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
