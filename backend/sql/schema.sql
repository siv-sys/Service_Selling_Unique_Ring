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
  username VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  city VARCHAR(120) NULL,
  is_public_discovery TINYINT(1) NOT NULL DEFAULT 1,
  account_status ENUM('ACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id TINYINT UNSIGNED NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
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
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uq_notifications_user_type_title (user_id, type, title),
  KEY idx_notifications_user (user_id),
  KEY idx_notifications_unread (user_id, unread, created_at)
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
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id)
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
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id),
  KEY idx_user_sessions_user (user_id),
  KEY idx_user_sessions_revoked (user_id, revoked_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  plan_name VARCHAR(80) NOT NULL DEFAULT 'Premium Plan',
  auto_renew_enabled TINYINT(1) NOT NULL DEFAULT 1,
  renewing_on DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Example reusable inserts for other features:
-- INSERT INTO notifications (user_id, type, icon, icon_class, title, message)
-- VALUES (1, 'memory', '🖼', 'image', 'New memory added', 'Your partner added a new photo to your timeline.');
--
-- INSERT INTO notifications (user_id, type, icon, icon_class, title, message)
-- VALUES (1, 'security', '🔒', 'system', 'Security alert', 'A new device signed in to your account.');

CREATE TABLE IF NOT EXISTS relationship_pairs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pair_code VARCHAR(30) NOT NULL UNIQUE,
  status ENUM('PENDING', 'CONNECTED', 'SYNCING', 'SUSPENDED', 'UNPAIRED') NOT NULL DEFAULT 'PENDING',
  access_level ENUM('FULL_ACCESS', 'LIMITED', 'REVOKED') NOT NULL DEFAULT 'FULL_ACCESS',
  established_at DATE NULL,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_relationship_pairs_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pair_members (
  pair_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  member_role ENUM('OWNER', 'PARTNER') NOT NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (pair_id, user_id),
  UNIQUE KEY uq_pair_members_user (user_id),
  CONSTRAINT fk_pair_members_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id),
  CONSTRAINT fk_pair_members_user FOREIGN KEY (user_id) REFERENCES users(id)
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
  CONSTRAINT fk_pair_invitations_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id),
  CONSTRAINT fk_pair_invitations_inviter FOREIGN KEY (inviter_user_id) REFERENCES users(id),
  CONSTRAINT fk_pair_invitations_invitee FOREIGN KEY (invitee_user_id) REFERENCES users(id)
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

-- Migration for existing databases (run once if ring_models already exists):
ALTER TABLE ring_models
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER description;

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
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rings_model FOREIGN KEY (model_id) REFERENCES ring_models(id),
  CONSTRAINT fk_rings_batch FOREIGN KEY (batch_id) REFERENCES ring_batches(id)
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
  CONSTRAINT fk_ring_pair_links_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id),
  CONSTRAINT fk_ring_pair_links_ring FOREIGN KEY (ring_id) REFERENCES rings(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS memories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pair_id BIGINT UNSIGNED NOT NULL,
  uploader_user_id BIGINT UNSIGNED NOT NULL,
  media_url VARCHAR(500) NOT NULL,
  caption VARCHAR(500) NOT NULL,
  ai_caption VARCHAR(500) NULL,
  memory_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_memories_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id),
  CONSTRAINT fk_memories_uploader FOREIGN KEY (uploader_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ring_scans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ring_id BIGINT UNSIGNED NULL,
  scanned_by_user_id BIGINT UNSIGNED NULL,
  pair_id BIGINT UNSIGNED NULL,
  scan_mode ENUM('LOGIN', 'RING_SCAN', 'PAIR_SYNC') NOT NULL,
  scan_source ENUM('CAMERA', 'NFC', 'BLUETOOTH', 'MANUAL') NOT NULL,
  scan_status ENUM('SUCCESS', 'FAILED', 'ABORTED') NOT NULL,
  encryption_label VARCHAR(50) NULL,
  signal_strength SMALLINT NULL,
  metadata_json JSON NULL,
  scanned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ring_scans_ring FOREIGN KEY (ring_id) REFERENCES rings(id),
  CONSTRAINT fk_ring_scans_user FOREIGN KEY (scanned_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_ring_scans_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS security_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(120) NOT NULL,
  severity ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUCCESS') NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  actor_label VARCHAR(120) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  details TEXT NULL,
  pair_id BIGINT UNSIGNED NULL,
  ring_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_security_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users(id),
  CONSTRAINT fk_security_logs_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id),
  CONSTRAINT fk_security_logs_ring FOREIGN KEY (ring_id) REFERENCES rings(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS proximity_preferences (
  pair_id BIGINT UNSIGNED PRIMARY KEY,
  alerts_enabled TINYINT(1) NOT NULL DEFAULT 1,
  threshold_meters INT UNSIGNED NOT NULL DEFAULT 50,
  visibility_mode ENUM('PUBLIC', 'PARTNERS_ONLY', 'PRIVATE') NOT NULL DEFAULT 'PARTNERS_ONLY',
  emergency_contact_name VARCHAR(120) NULL,
  emergency_contact_phone VARCHAR(30) NULL,
  updated_by_user_id BIGINT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_proximity_preferences_pair FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id),
  CONSTRAINT fk_proximity_preferences_user FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS platform_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value VARCHAR(500) NOT NULL,
  updated_by_user_id BIGINT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_platform_settings_user FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS security_policies (
  id TINYINT UNSIGNED PRIMARY KEY,
  mfa_required TINYINT(1) NOT NULL DEFAULT 1,
  strict_password_policy TINYINT(1) NOT NULL DEFAULT 1,
  session_timeout_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  max_login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 5,
  updated_by_user_id BIGINT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_security_policies_user FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

INSERT INTO roles (code, description)
VALUES
  ('USER', 'Standard end-user account'),
  ('SELLER', 'Seller account for product and service management'),
  ('ADMIN', 'Administrator account')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO security_policies (id, mfa_required, strict_password_policy, session_timeout_minutes, max_login_attempts)
VALUES (1, 1, 1, 30, 5)
ON DUPLICATE KEY UPDATE
  mfa_required = VALUES(mfa_required),
  strict_password_policy = VALUES(strict_password_policy),
  session_timeout_minutes = VALUES(session_timeout_minutes),
  max_login_attempts = VALUES(max_login_attempts);


-- Sample seed data

INSERT INTO users 
(username, full_name, email, password_hash, city)
VALUES
('john123', 'John Carter', 'john@example.com', 'hashed_password_1', 'New York'),
('anna456', 'Anna Lee', 'anna@example.com', 'hashed_password_2', 'Los Angeles');


INSERT INTO user_roles (user_id, role_id)
VALUES
(1, 1),
(2, 1);


INSERT INTO notifications
(user_id, type, icon, icon_class, action_key, title, message, unread, created_at)
VALUES
(1, 'photo', '🖼', 'image', 'couple_profile', 'New photo added by partner', 'Anna just uploaded a new memory to your shared gallery.', 1, DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(1, 'anniversary', '📅', 'calendar', 'help_support', 'Upcoming anniversary reminder', 'Your anniversary is in 3 days. Time to celebrate!', 1, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(1, 'gift', '🎁', 'gift', 'general', 'Gift suggestion for you', 'Check out these personalized ring designs for your special day.', 0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(1, 'system', '⚙', 'system', 'general', 'System update', 'Eternal Rings has new shared journey improvements.', 0, DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE
  action_key = VALUES(action_key),
  title = VALUES(title),
  message = VALUES(message),
  unread = VALUES(unread);


INSERT INTO user_settings
(user_id, two_factor_enabled, privacy_level, theme_mode, anniversary_reminders, system_updates, auto_sync, language, global_mute, dnd_enabled, dnd_from_time, dnd_until_time, repeat_daily, anniversary_sound, reminders_sound, messages_sound, email_weekly_wrap, email_product_tips, email_occasion_reminders, email_partner_alerts, last_export_at, last_synced_at)
VALUES
(1, 0, 'Contacts', 'Light', 1, 0, 1, 'English (US)', 0, 1, '22:00:00', '07:00:00', 1, 'Bell Chime', 'Soft Hum', 'Digital Pop', 1, 0, 1, 1, NULL, DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(2, 1, 'Private', 'System', 1, 1, 1, 'French (FR)', 0, 1, '23:00:00', '06:00:00', 1, 'Crystal Bell', 'Wind Bell', 'Pulse Beat', 1, 1, 1, 1, NULL, DATE_SUB(NOW(), INTERVAL 15 MINUTE))
ON DUPLICATE KEY UPDATE
  two_factor_enabled = VALUES(two_factor_enabled),
  privacy_level = VALUES(privacy_level),
  theme_mode = VALUES(theme_mode),
  anniversary_reminders = VALUES(anniversary_reminders),
  system_updates = VALUES(system_updates),
  auto_sync = VALUES(auto_sync),
  language = VALUES(language),
  global_mute = VALUES(global_mute),
  dnd_enabled = VALUES(dnd_enabled),
  dnd_from_time = VALUES(dnd_from_time),
  dnd_until_time = VALUES(dnd_until_time),
  repeat_daily = VALUES(repeat_daily),
  anniversary_sound = VALUES(anniversary_sound),
  reminders_sound = VALUES(reminders_sound),
  messages_sound = VALUES(messages_sound),
  email_weekly_wrap = VALUES(email_weekly_wrap),
  email_product_tips = VALUES(email_product_tips),
  email_occasion_reminders = VALUES(email_occasion_reminders),
  email_partner_alerts = VALUES(email_partner_alerts),
  last_export_at = VALUES(last_export_at),
  last_synced_at = VALUES(last_synced_at);


INSERT INTO subscriptions
(user_id, plan_name, auto_renew_enabled, renewing_on)
VALUES
(1, 'Premium Plan', 1, '2026-12-12 00:00:00'),
(2, 'Premium Plan', 1, '2026-12-12 00:00:00')
ON DUPLICATE KEY UPDATE
  plan_name = VALUES(plan_name),
  auto_renew_enabled = VALUES(auto_renew_enabled),
  renewing_on = VALUES(renewing_on);


INSERT INTO user_sessions
(user_id, session_token, device_name, location_label, status_label, badge, icon, last_seen_at, revoked_at)
VALUES
(1, 'demo-session-macbook', 'MacBook Pro 16"', 'London, United Kingdom', 'Active now', 'CURRENT', '💻', NOW(), NULL),
(1, 'demo-session-iphone', 'iPhone 15 Pro', 'Paris, France', 'Last active: 2 hours ago', '', '📱', DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL),
(1, 'demo-session-ipad', 'iPad Air', 'Berlin, Germany', 'Last active: Oct 12, 2023', '', '📲', '2023-10-12 10:00:00', NULL)
ON DUPLICATE KEY UPDATE
  location_label = VALUES(location_label),
  status_label = VALUES(status_label),
  badge = VALUES(badge),
  icon = VALUES(icon),
  last_seen_at = VALUES(last_seen_at),
  revoked_at = VALUES(revoked_at);


INSERT INTO relationship_pairs
(pair_code, status, created_by_user_id, established_at)
VALUES
('PAIR001', 'CONNECTED', 1, '2025-01-01'),
('PAIR002', 'PENDING', 2, NULL);


INSERT INTO pair_members
(pair_id, user_id, member_role)
VALUES
(1, 1, 'OWNER'),
(1, 2, 'PARTNER');


INSERT INTO pair_invitations
(pair_id, inviter_user_id, invitee_user_id, invitation_token, expires_at)
VALUES
(2, 2, 1, 'uuid-token-1111-aaaa', '2026-12-31'),
(1, 1, 2, 'uuid-token-2222-bbbb', '2026-12-31');


INSERT INTO ring_models
(model_name, collection_name, material, image_url, base_price)
VALUES
('Eternal Love', 'Classic Series', 'Gold', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&h=800&fit=crop', 499.99),
('Infinity Bond', 'Premium Series', 'Platinum', 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?q=80&w=600&h=800&fit=crop', 899.99);


INSERT INTO ring_batches
(batch_code, manufactured_at)
VALUES
('BATCH001', '2025-01-10'),
('BATCH002', '2025-02-15');


INSERT INTO rings
(ring_identifier, ring_name, model_id, batch_id, material, price)
VALUES
('RING-001', 'John Ring', 1, 1, 'Gold', 550.00),
('RING-002', 'Anna Ring', 2, 2, 'Platinum', 950.00);


INSERT INTO ring_pair_links
(pair_id, ring_id, side)
VALUES
(1, 1, 'A'),
(1, 2, 'B');


INSERT INTO memories
(pair_id, uploader_user_id, media_url, caption, memory_date)
VALUES
(1, 1, 'https://example.com/photo1.jpg', 'Our first trip', '2025-01-20'),
(1, 2, 'https://example.com/photo2.jpg', 'Anniversary dinner', '2025-02-14');



INSERT INTO ring_scans
(ring_id, scanned_by_user_id, pair_id, scan_mode, scan_source, scan_status)
VALUES
(1, 1, 1, 'LOGIN', 'NFC', 'SUCCESS'),
(2, 2, 1, 'PAIR_SYNC', 'BLUETOOTH', 'SUCCESS');


INSERT INTO security_logs
(event_type, severity, actor_user_id, details)
VALUES
('LOGIN_SUCCESS', 'SUCCESS', 1, 'User logged in successfully'),
('PAIR_CREATED', 'MEDIUM', 1, 'Relationship pair created');


INSERT INTO proximity_preferences
(pair_id, threshold_meters)
VALUES
(1, 100),
(2, 75);


INSERT INTO platform_settings
(setting_key, setting_value)
VALUES
('DEFAULT_CURRENCY', 'USD'),
('MAX_MEMORY_UPLOAD_MB', '50');



USE ring_app;

-- 1) Insert shop products (ring models)
INSERT INTO ring_models
(model_name, collection_name, material, description, image_url, base_price, currency_code)
VALUES
('Eternal Bond Gold', 'Classic Series', '18K Gold', 'Premium gold couple ring set with engraved inner band.', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&h=800&fit=crop', 1200.00, 'USD'),
('Twin Souls Silver', 'Modern Series', 'Sterling Silver', 'Minimalist silver pair with hammered finish.', 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?q=80&w=600&h=800&fit=crop', 850.00, 'USD'),
('Vintage Rose Promise', 'Heritage Series', 'Rose Gold', 'Vintage-inspired rose gold design with filigree detail.', 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&h=800&fit=crop', 1450.00, 'USD');

-- 2) (Optional but recommended) Insert ring inventory so availableUnits > 0 in shop
-- Assume model IDs 1,2,3 already exist or use the IDs returned by your DB.
INSERT INTO rings
(ring_identifier, ring_name, model_id, batch_id, size, material, status, location_type, location_label, price)
VALUES
('SHOP-EBG-001', 'Eternal Bond Gold A', 1, NULL, '7', '18K Gold', 'AVAILABLE', 'WAREHOUSE', 'Main WH', 1200.00),
('SHOP-EBG-002', 'Eternal Bond Gold B', 1, NULL, '8', '18K Gold', 'AVAILABLE', 'WAREHOUSE', 'Main WH', 1200.00),
('SHOP-TSS-001', 'Twin Souls Silver A', 2, NULL, '6', 'Sterling Silver', 'AVAILABLE', 'WAREHOUSE', 'Main WH', 850.00),
('SHOP-VRP-001', 'Vintage Rose Promise A', 3, NULL, '7', 'Rose Gold', 'AVAILABLE', 'WAREHOUSE', 'Main WH', 1450.00);



