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

async function tableExists(tableName) {
  const rows = await query(
    `
      SELECT 1
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      LIMIT 1
    `,
    [tableName],
  );

  return rows.length > 0;
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
      avatar_url VARCHAR(500) NULL,
      profile_headline VARCHAR(255) NULL,
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
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL AFTER name,
    ADD COLUMN IF NOT EXISTS profile_headline VARCHAR(255) NULL AFTER avatar_url,
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(40) NULL AFTER avatar_url,
    ADD COLUMN IF NOT EXISTS role ENUM('admin', 'user') NOT NULL DEFAULT 'user' AFTER avatar_url,
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
    CREATE TABLE IF NOT EXISTS roles (
      id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(30) NOT NULL UNIQUE,
      description VARCHAR(120) NULL
    ) ENGINE=InnoDB
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id ${userIdType} NOT NULL,
      role_id TINYINT UNSIGNED NOT NULL,
      assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, role_id)
    ) ENGINE=InnoDB
  `);
  await execute(
    `
      ALTER TABLE user_roles
      ADD CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `,
  ).catch(() => {});
  await execute(
    `
      ALTER TABLE user_roles
      ADD CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    `,
  ).catch(() => {});
  await execute(
    `
      INSERT INTO roles (code, description)
      VALUES
        ('ADMIN', 'Platform administrator'),
        ('USER', 'Standard user')
      ON DUPLICATE KEY UPDATE description = VALUES(description)
    `,
  ).catch(() => {});

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
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id ${userIdType} NOT NULL,
      type VARCHAR(40) NOT NULL,
      icon VARCHAR(8) NULL,
      icon_class VARCHAR(30) NOT NULL DEFAULT 'system',
      action_key VARCHAR(40) NULL,
      title VARCHAR(160) NOT NULL,
      message VARCHAR(500) NOT NULL,
      unread BOOLEAN NOT NULL DEFAULT TRUE,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME NULL,
      clicked_at DATETIME NULL,
      opened_count INT UNSIGNED NOT NULL DEFAULT 0,
      UNIQUE KEY uq_notifications_user_type_title (user_id, type, title),
      KEY idx_notifications_user (user_id),
      KEY idx_notifications_unread (user_id, unread, created_at)
    ) ENGINE=InnoDB
  `);
  await execute(`ALTER TABLE notifications MODIFY COLUMN user_id ${userIdType} NOT NULL`);
  await execute(`
    ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS metadata JSON NULL AFTER unread
  `).catch(() => {});
  await execute(
    `
      ALTER TABLE notifications
      ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `,
  ).catch(() => {});

  await execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id ${userIdType} PRIMARY KEY,
      two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      privacy_level ENUM('Public', 'Contacts', 'Private') NOT NULL DEFAULT 'Contacts',
      theme_mode ENUM('Light', 'Dark', 'System') NOT NULL DEFAULT 'Light',
      anniversary_reminders BOOLEAN NOT NULL DEFAULT TRUE,
      system_updates BOOLEAN NOT NULL DEFAULT FALSE,
      auto_sync BOOLEAN NOT NULL DEFAULT TRUE,
      language VARCHAR(40) NOT NULL DEFAULT 'English (US)',
      global_mute BOOLEAN NOT NULL DEFAULT FALSE,
      dnd_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      dnd_from_time TIME NULL,
      dnd_until_time TIME NULL,
      repeat_daily BOOLEAN NOT NULL DEFAULT TRUE,
      anniversary_sound VARCHAR(60) NOT NULL DEFAULT 'Bell Chime',
      reminders_sound VARCHAR(60) NOT NULL DEFAULT 'Soft Hum',
      messages_sound VARCHAR(60) NOT NULL DEFAULT 'Digital Pop',
      email_weekly_wrap BOOLEAN NOT NULL DEFAULT TRUE,
      email_product_tips BOOLEAN NOT NULL DEFAULT FALSE,
      email_occasion_reminders BOOLEAN NOT NULL DEFAULT TRUE,
      email_partner_alerts BOOLEAN NOT NULL DEFAULT TRUE,
      last_export_at DATETIME NULL,
      last_synced_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  await execute(
    `
      ALTER TABLE user_settings
      ADD CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `,
  ).catch(() => {});

  await execute(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id ${userIdType} NOT NULL,
      session_token VARCHAR(255) NOT NULL UNIQUE,
      device_name VARCHAR(120) NULL,
      location_label VARCHAR(160) NULL,
      status_label VARCHAR(160) NULL,
      badge VARCHAR(30) NULL,
      icon VARCHAR(8) NULL,
      last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      revoked_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_user_sessions_user (user_id),
      KEY idx_user_sessions_revoked (user_id, revoked_at)
    ) ENGINE=InnoDB
  `);
  await execute(`ALTER TABLE user_sessions MODIFY COLUMN user_id ${userIdType} NOT NULL`);
  await execute(
    `
      ALTER TABLE user_sessions
      ADD CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `,
  ).catch(() => {});

  await execute(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      user_id ${userIdType} PRIMARY KEY,
      plan_name VARCHAR(80) NOT NULL DEFAULT 'Premium Plan',
      auto_renew_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      renewing_on DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  await execute(
    `
      ALTER TABLE subscriptions
      ADD CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

  await execute(`
    CREATE TABLE IF NOT EXISTS relationship_pairs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      pair_code VARCHAR(30) NOT NULL UNIQUE,
      status ENUM('PENDING', 'CONNECTED', 'SYNCING', 'SUSPENDED', 'UNPAIRED') NOT NULL DEFAULT 'PENDING',
      access_level ENUM('FULL_ACCESS', 'LIMITED', 'REVOKED') NOT NULL DEFAULT 'FULL_ACCESS',
      established_at DATE NULL,
      created_by_user_id ${userIdType} NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_relationship_pairs_status (status)
    ) ENGINE=InnoDB
  `);
  await execute(
    `
      ALTER TABLE relationship_pairs
      ADD CONSTRAINT fk_relationship_pairs_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
    `,
  ).catch(() => {});

  await execute(`
    CREATE TABLE IF NOT EXISTS pair_members (
      pair_id BIGINT NOT NULL,
      user_id ${userIdType} NOT NULL,
      member_role ENUM('OWNER', 'PARTNER') NOT NULL,
      joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (pair_id, user_id),
      UNIQUE KEY uq_pair_members_user (user_id)
    ) ENGINE=InnoDB
  `);
  await execute(
    `
      ALTER TABLE pair_members
      ADD CONSTRAINT fk_pair_members_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id) ON DELETE CASCADE
    `,
  ).catch(() => {});
  await execute(
    `
      ALTER TABLE pair_members
      ADD CONSTRAINT fk_pair_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `,
  ).catch(() => {});

  await execute(`
    CREATE TABLE IF NOT EXISTS pair_invitations (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      pair_id BIGINT NULL,
      inviter_user_id ${userIdType} NOT NULL,
      invitee_user_id ${userIdType} NULL,
      invitee_handle VARCHAR(50) NULL,
      invitee_ring_identifier VARCHAR(60) NULL,
      invitation_token CHAR(36) NOT NULL UNIQUE,
      status ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
      expires_at DATETIME NULL,
      responded_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  await execute(
    `
      ALTER TABLE pair_invitations
      ADD CONSTRAINT fk_pair_invitations_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id) ON DELETE SET NULL
    `,
  ).catch(() => {});
  await execute(
    `
      ALTER TABLE pair_invitations
      ADD CONSTRAINT fk_pair_invitations_inviter FOREIGN KEY (inviter_user_id) REFERENCES users(id) ON DELETE CASCADE
    `,
  ).catch(() => {});
  await execute(
    `
      ALTER TABLE pair_invitations
      ADD CONSTRAINT fk_pair_invitations_invitee FOREIGN KEY (invitee_user_id) REFERENCES users(id) ON DELETE SET NULL
    `,
  ).catch(() => {});

  await execute(`
    CREATE TABLE IF NOT EXISTS ring_models (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      model_name VARCHAR(120) NOT NULL,
      collection_name VARCHAR(120) NULL,
      material VARCHAR(80) NOT NULL,
      description TEXT NULL,
      image_url VARCHAR(500) NULL,
      base_price DECIMAL(12,2) NOT NULL,
      currency_code CHAR(3) NOT NULL DEFAULT 'USD',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS ring_batches (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      batch_code VARCHAR(40) NOT NULL UNIQUE,
      manufactured_at DATE NULL,
      notes VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS rings (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      ring_identifier VARCHAR(60) NOT NULL UNIQUE,
      ring_name VARCHAR(120) NOT NULL,
      model_id BIGINT NULL,
      batch_id BIGINT NULL,
      size VARCHAR(20) NULL,
      material VARCHAR(80) NOT NULL,
      status ENUM('AVAILABLE', 'RESERVED', 'ASSIGNED', 'LOST', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
      location_type ENUM('WAREHOUSE', 'USER', 'TRANSIT', 'SERVICE') NOT NULL DEFAULT 'WAREHOUSE',
      location_label VARCHAR(120) NULL,
      battery_level TINYINT NULL,
      last_seen_at DATETIME NULL,
      last_seen_lat DECIMAL(9,6) NULL,
      last_seen_lng DECIMAL(9,6) NULL,
      price DECIMAL(12,2) NOT NULL,
      image_url VARCHAR(500) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_rings_model_id (model_id),
      KEY idx_rings_batch_id (batch_id),
      KEY idx_rings_status (status)
    ) ENGINE=InnoDB
  `);
  await execute(
    `
      ALTER TABLE rings
      ADD CONSTRAINT fk_rings_model FOREIGN KEY (model_id) REFERENCES ring_models(id) ON DELETE SET NULL
    `,
  ).catch(() => {});
  await execute(
    `
      ALTER TABLE rings
      ADD CONSTRAINT fk_rings_batch FOREIGN KEY (batch_id) REFERENCES ring_batches(id) ON DELETE SET NULL
    `,
  ).catch(() => {});

  await execute(`
    CREATE TABLE IF NOT EXISTS ring_pair_links (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      pair_id BIGINT NOT NULL,
      ring_id BIGINT NOT NULL,
      side ENUM('A', 'B') NOT NULL,
      assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      unassigned_at DATETIME NULL,
      KEY idx_ring_pair_links_pair (pair_id),
      KEY idx_ring_pair_links_ring (ring_id),
      KEY idx_ring_pair_links_unassigned_at (unassigned_at)
    ) ENGINE=InnoDB
  `);
  await execute(
    `
      ALTER TABLE ring_pair_links
      ADD CONSTRAINT fk_ring_pair_links_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id) ON DELETE CASCADE
    `,
  ).catch(() => {});
  await execute(
    `
      ALTER TABLE ring_pair_links
      ADD CONSTRAINT fk_ring_pair_links_ring FOREIGN KEY (ring_id) REFERENCES rings(id) ON DELETE CASCADE
    `,
  ).catch(() => {});

  await execute(`
    CREATE TABLE IF NOT EXISTS couple_profiles (
      pair_id BIGINT PRIMARY KEY,
      title VARCHAR(160) NOT NULL,
      slug VARCHAR(160) NOT NULL,
      headline VARCHAR(255) NULL,
      hero_avatar_url VARCHAR(500) NULL,
      linked_partner_label VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_couple_profiles_slug (slug)
    ) ENGINE=InnoDB
  `);
  await execute(
    `
      ALTER TABLE couple_profiles
      ADD CONSTRAINT fk_couple_profiles_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id) ON DELETE CASCADE
    `,
  ).catch(() => {});

  await execute(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      image_url VARCHAR(500) NULL,
      model_name VARCHAR(120) NOT NULL,
      color VARCHAR(80) NULL,
      variant VARCHAR(160) NOT NULL,
      sku VARCHAR(80) NOT NULL UNIQUE,
      serial_number VARCHAR(120) NOT NULL UNIQUE,
      status VARCHAR(40) NOT NULL DEFAULT 'In Stock',
      stock_qty INT UNSIGNED NOT NULL DEFAULT 0,
      stock_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
      status_color VARCHAR(20) NOT NULL DEFAULT 'emerald',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_inventory_model (model_name),
      KEY idx_inventory_color (color),
      KEY idx_inventory_status (status)
    ) ENGINE=InnoDB
  `);

  if (await tableExists('ring_models')) {
    await execute(`
      ALTER TABLE ring_models
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER description
    `).catch(() => {});
  }

  if (await tableExists('rings')) {
    await execute(`
      ALTER TABLE rings
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER price
    `).catch(() => {});
  }

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
