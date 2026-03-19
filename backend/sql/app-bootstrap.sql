CREATE DATABASE IF NOT EXISTS ring_app;
USE ring_app;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS roles (
  id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  description VARCHAR(120) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(50) NULL,
  full_name VARCHAR(120) NULL,
  name VARCHAR(100) NULL,
  avatar_url VARCHAR(500) NULL,
  phone_number VARCHAR(40) NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  account_status ENUM('ACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
  remember_token VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id TINYINT UNSIGNED NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO roles (code, description)
VALUES
  ('ADMIN', 'Platform administrator'),
  ('USER', 'Standard user')
ON DUPLICATE KEY UPDATE description = VALUES(description);

CREATE TABLE IF NOT EXISTS user_providers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_provider (provider, provider_id),
  KEY idx_user_provider_user_id (user_id),
  CONSTRAINT fk_user_providers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  last_used_at DATETIME NULL,
  user_agent VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_auth_sessions_token_hash (token_hash),
  KEY idx_auth_sessions_user_id (user_id),
  KEY idx_auth_sessions_expires_at (expires_at),
  CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(40) NOT NULL,
  icon VARCHAR(8) NULL,
  icon_class VARCHAR(30) NOT NULL DEFAULT 'system',
  action_key VARCHAR(40) NULL,
  title VARCHAR(160) NOT NULL,
  message VARCHAR(500) NOT NULL,
  unread TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  clicked_at DATETIME NULL,
  opened_count INT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_notifications_user_type_title (user_id, type, title),
  KEY idx_notifications_user (user_id),
  KEY idx_notifications_unread (user_id, unread, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_settings (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
  privacy_level ENUM('Public', 'Contacts', 'Private') NOT NULL DEFAULT 'Contacts',
  theme_mode ENUM('Light', 'Dark', 'System') NOT NULL DEFAULT 'Light',
  anniversary_reminders TINYINT(1) NOT NULL DEFAULT 1,
  system_updates TINYINT(1) NOT NULL DEFAULT 0,
  auto_sync TINYINT(1) NOT NULL DEFAULT 1,
  language VARCHAR(40) NOT NULL DEFAULT 'English (US)',
  global_mute TINYINT(1) NOT NULL DEFAULT 0,
  dnd_enabled TINYINT(1) NOT NULL DEFAULT 1,
  dnd_from_time TIME NULL,
  dnd_until_time TIME NULL,
  repeat_daily TINYINT(1) NOT NULL DEFAULT 1,
  anniversary_sound VARCHAR(60) NOT NULL DEFAULT 'Bell Chime',
  reminders_sound VARCHAR(60) NOT NULL DEFAULT 'Soft Hum',
  messages_sound VARCHAR(60) NOT NULL DEFAULT 'Digital Pop',
  email_weekly_wrap TINYINT(1) NOT NULL DEFAULT 1,
  email_product_tips TINYINT(1) NOT NULL DEFAULT 0,
  email_occasion_reminders TINYINT(1) NOT NULL DEFAULT 1,
  email_partner_alerts TINYINT(1) NOT NULL DEFAULT 1,
  last_export_at DATETIME NULL,
  last_synced_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
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
  KEY idx_user_sessions_revoked (user_id, revoked_at),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  plan_name VARCHAR(80) NOT NULL DEFAULT 'Premium Plan',
  auto_renew_enabled TINYINT(1) NOT NULL DEFAULT 1,
  renewing_on DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_name VARCHAR(150) NOT NULL,
  support_email VARCHAR(150) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO system_settings (shop_name, support_email, currency)
VALUES ('Aura Rings Main', 'support@aurarings.com', 'USD')
ON DUPLICATE KEY UPDATE shop_name = VALUES(shop_name);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  system_updates TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_notification_user (user_id),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS relationship_pairs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pair_code VARCHAR(30) NOT NULL UNIQUE,
  status ENUM('PENDING', 'CONNECTED', 'SYNCING', 'SUSPENDED', 'UNPAIRED') NOT NULL DEFAULT 'PENDING',
  access_level ENUM('FULL_ACCESS', 'LIMITED', 'REVOKED') NOT NULL DEFAULT 'FULL_ACCESS',
  established_at DATE NULL,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_relationship_pairs_status (status),
  CONSTRAINT fk_relationship_pairs_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pair_members (
  pair_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  member_role ENUM('OWNER', 'PARTNER') NOT NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (pair_id, user_id),
  UNIQUE KEY uq_pair_members_user (user_id),
  CONSTRAINT fk_pair_members_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id) ON DELETE CASCADE,
  CONSTRAINT fk_pair_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pair_invitations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pair_id BIGINT UNSIGNED NULL,
  inviter_user_id BIGINT UNSIGNED NOT NULL,
  invitee_user_id BIGINT UNSIGNED NULL,
  invitee_handle VARCHAR(50) NULL,
  invitee_ring_identifier VARCHAR(60) NULL,
  invitation_token CHAR(36) NOT NULL UNIQUE,
  status ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  expires_at DATETIME NULL,
  responded_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pair_invitations_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id) ON DELETE SET NULL,
  CONSTRAINT fk_pair_invitations_inviter FOREIGN KEY (inviter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_pair_invitations_invitee FOREIGN KEY (invitee_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ring_models (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(120) NOT NULL,
  collection_name VARCHAR(120) NULL,
  material VARCHAR(80) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  base_price DECIMAL(12,2) NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ring_batches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  batch_code VARCHAR(40) NOT NULL UNIQUE,
  manufactured_at DATE NULL,
  notes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ring_identifier VARCHAR(60) NOT NULL UNIQUE,
  ring_name VARCHAR(120) NOT NULL,
  model_id BIGINT UNSIGNED NULL,
  batch_id BIGINT UNSIGNED NULL,
  size VARCHAR(20) NULL,
  material VARCHAR(80) NOT NULL,
  status ENUM('AVAILABLE', 'RESERVED', 'ASSIGNED', 'LOST', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
  location_type ENUM('WAREHOUSE', 'USER', 'TRANSIT', 'SERVICE') NOT NULL DEFAULT 'WAREHOUSE',
  location_label VARCHAR(120) NULL,
  battery_level TINYINT UNSIGNED NULL,
  last_seen_at DATETIME NULL,
  last_seen_lat DECIMAL(9,6) NULL,
  last_seen_lng DECIMAL(9,6) NULL,
  price DECIMAL(12,2) NOT NULL,
  image_url VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_rings_model_id (model_id),
  KEY idx_rings_batch_id (batch_id),
  KEY idx_rings_status (status),
  CONSTRAINT fk_rings_model FOREIGN KEY (model_id) REFERENCES ring_models(id) ON DELETE SET NULL,
  CONSTRAINT fk_rings_batch FOREIGN KEY (batch_id) REFERENCES ring_batches(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ring_pair_links (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pair_id BIGINT UNSIGNED NOT NULL,
  ring_id BIGINT UNSIGNED NOT NULL,
  side ENUM('A', 'B') NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unassigned_at DATETIME NULL,
  KEY idx_ring_pair_links_pair (pair_id),
  KEY idx_ring_pair_links_ring (ring_id),
  KEY idx_ring_pair_links_unassigned_at (unassigned_at),
  CONSTRAINT fk_ring_pair_links_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id) ON DELETE CASCADE,
  CONSTRAINT fk_ring_pair_links_ring FOREIGN KEY (ring_id) REFERENCES rings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS couple_profiles (
  pair_id BIGINT UNSIGNED PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  headline VARCHAR(255) NULL,
  hero_avatar_url VARCHAR(500) NULL,
  linked_partner_label VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_couple_profiles_slug (slug),
  CONSTRAINT fk_couple_profiles_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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
) ENGINE=InnoDB;
