
const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: env.dbConnectionLimit,
  queueLimit: 0,
  namedPlaceholders: true,
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

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

  await query(`
    CREATE TABLE IF NOT EXISTS admin_profile_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NULL,
      full_name VARCHAR(120) NOT NULL,
      role VARCHAR(80) NOT NULL,
      email VARCHAR(190) NOT NULL,
      avatar_url MEDIUMTEXT NULL,
      system_updates BOOLEAN DEFAULT TRUE,
      security_alerts BOOLEAN DEFAULT TRUE,
      order_placement BOOLEAN DEFAULT FALSE,
      push_notifications BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  const adminProfileColumns = await query('SHOW COLUMNS FROM admin_profile_settings');
  const hasUserIdColumn = adminProfileColumns.some(
    (column) => String(column.Field || '').toLowerCase() === 'user_id',
  );
  if (!hasUserIdColumn) {
    await query('ALTER TABLE admin_profile_settings ADD COLUMN user_id BIGINT UNSIGNED NULL');
  }

  const rows = await query('SELECT id FROM system_settings LIMIT 1');
  if (!rows.length) {
    await query(
      'INSERT INTO system_settings (shop_name, support_email, currency) VALUES (?, ?, ?)',
      ['Aura Rings Main', 'support@aurarings.com', 'USD'],
    );
  }

}

module.exports = {
  pool,
  query,
  pingDb,
  initializeSettingsTables,
};
