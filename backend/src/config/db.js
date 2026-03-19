<<<<<<< HEAD
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
  namedPlaceholders: true,
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
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

async function initializeCoreTables() {
  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      username VARCHAR(50) NULL,
      full_name VARCHAR(120) NULL,
      name VARCHAR(100) NULL,
      role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
      account_status ENUM('ACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
      remember_token VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  const userIdTypeRows = await query(
    `
      SELECT COLUMN_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'id'
      LIMIT 1
    `,
  );
  const userIdType = userIdTypeRows[0]?.COLUMN_TYPE
    ? String(userIdTypeRows[0].COLUMN_TYPE).toUpperCase()
    : 'BIGINT';

  await execute(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER email,
    ADD COLUMN IF NOT EXISTS username VARCHAR(50) NULL AFTER id,
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(120) NULL AFTER username,
    ADD COLUMN IF NOT EXISTS name VARCHAR(100) NULL AFTER email,
    ADD COLUMN IF NOT EXISTS role ENUM('admin', 'user') NOT NULL DEFAULT 'user' AFTER name,
    ADD COLUMN IF NOT EXISTS account_status ENUM('ACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE' AFTER role,
    ADD COLUMN IF NOT EXISTS remember_token VARCHAR(255) NULL AFTER account_status
  `);

  await execute(`
    UPDATE users
    SET username = COALESCE(NULLIF(username, ''), SUBSTRING_INDEX(email, '@', 1))
    WHERE username IS NULL OR username = ''
  `);
  await execute(`
    UPDATE users
    SET full_name = COALESCE(NULLIF(full_name, ''), NULLIF(name, ''), NULLIF(username, ''), SUBSTRING_INDEX(email, '@', 1))
    WHERE full_name IS NULL OR full_name = ''
  `);
  await execute(`
    UPDATE users
    SET name = COALESCE(NULLIF(name, ''), NULLIF(full_name, ''), NULLIF(username, ''), SUBSTRING_INDEX(email, '@', 1))
    WHERE name IS NULL OR name = ''
  `);
  await execute(`
    UPDATE users
    SET password_hash = COALESCE(NULLIF(password_hash, ''), CONCAT('temp_', id))
    WHERE password_hash IS NULL OR password_hash = ''
  `);
  await execute(`
    ALTER TABLE users
    MODIFY COLUMN password_hash VARCHAR(255) NOT NULL
  `);

  await execute(`
    UPDATE users u
    JOIN (
      SELECT ur.user_id, MAX(CASE WHEN r.code = 'ADMIN' THEN 1 ELSE 0 END) AS is_admin
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      GROUP BY ur.user_id
    ) role_map ON role_map.user_id = u.id
    SET u.role = CASE WHEN role_map.is_admin = 1 THEN 'admin' ELSE 'user' END
  `).catch(() => {});

  await execute(`
    CREATE TABLE IF NOT EXISTS user_providers (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id ${userIdType} NOT NULL,
      provider VARCHAR(50) NOT NULL,
      provider_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_provider (provider, provider_id),
      KEY idx_user_provider_user_id (user_id)
    ) ENGINE=InnoDB
  `);
  await execute(`ALTER TABLE user_providers MODIFY COLUMN user_id ${userIdType} NOT NULL`);
  await execute(
    `
      ALTER TABLE user_providers
      ADD CONSTRAINT fk_user_providers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `,
  ).catch(() => {});

  await execute(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id ${userIdType} NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME NULL,
      last_used_at DATETIME NULL,
      user_agent VARCHAR(255) NULL,
      ip_address VARCHAR(45) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_auth_sessions_token_hash (token_hash),
      KEY idx_auth_sessions_user_id (user_id),
      KEY idx_auth_sessions_expires_at (expires_at)
    ) ENGINE=InnoDB
  `);
  await execute(`ALTER TABLE auth_sessions MODIFY COLUMN user_id ${userIdType} NOT NULL`);
  await execute(
    `
      ALTER TABLE auth_sessions
      ADD CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `,
  ).catch(() => {});

  await execute(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shop_name VARCHAR(150) NOT NULL,
      support_email VARCHAR(150) NOT NULL,
      currency VARCHAR(10) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id ${userIdType} NOT NULL,
      system_updates BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_notification_user (user_id)
    ) ENGINE=InnoDB
  `);
  await execute(`ALTER TABLE notification_preferences MODIFY COLUMN user_id ${userIdType} NOT NULL`);
  await execute(
    `
      ALTER TABLE notification_preferences
      ADD CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `,
  ).catch(() => {});

  const settingsRows = await query('SELECT id FROM system_settings LIMIT 1');
  if (!settingsRows.length) {
    await execute(
      'INSERT INTO system_settings (shop_name, support_email, currency) VALUES (?, ?, ?)',
      ['Aura Rings Main', 'support@aurarings.com', 'USD'],
    );
  }
}

module.exports = {
  pool,
  query,
  execute,
  ping,
  initializeCoreTables,
};
=======
﻿
>>>>>>> integration_branch
