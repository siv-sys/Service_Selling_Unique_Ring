<<<<<<< HEAD
const mysql = require('mysql2/promise');
=======
﻿
const mysql = require('mysql2/promise');
<<<<<<< HEAD
>>>>>>> feature/ringInventory
const env = require('./env');

const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
<<<<<<< HEAD
  connectionLimit: env.dbConnectionLimit,
  waitForConnections: true,
=======
  waitForConnections: true,
  connectionLimit: env.dbConnectionLimit,
  queueLimit: 0,
  namedPlaceholders: true,
>>>>>>> feature/ringInventory
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

<<<<<<< HEAD
async function testConnection() {
  const conn = await pool.getConnection();
  conn.release();
=======
async function pingDb() {
  await query('SELECT 1');
}

async function initializeSettingsTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shop_name VARCHAR(150),
      support_email VARCHAR(150),
      currency VARCHAR(10),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      system_updates BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_notification
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB
  `);

  const rows = await query('SELECT id FROM system_settings LIMIT 1');
  if (!rows.length) {
    await query(
      'INSERT INTO system_settings (shop_name, support_email, currency) VALUES (?, ?, ?)',
      ['Aura Rings Main', 'support@aurarings.com', 'USD'],
    );
  }
=======
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
>>>>>>> feature/ringInventory
>>>>>>> feature/ringInventory
}

module.exports = {
  pool,
  query,
<<<<<<< HEAD
  testConnection,
};
=======
<<<<<<< HEAD
  pingDb,
  initializeSettingsTables,
};
=======
  ping,
};
>>>>>>> feature/ringInventory
>>>>>>> feature/ringInventory
>>>>>>> feature/ringInventory
