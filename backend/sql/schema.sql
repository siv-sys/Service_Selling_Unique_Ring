-- Database Schema for Service Selling Unique Ring

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

CREATE TABLE IF NOT EXISTS users_ring (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  ring_id BIGINT UNSIGNED NOT NULL,
  ring_status ENUM('ASSIGNED', 'AVAILABLE', 'PENDING', 'UNASSIGNED') NOT NULL DEFAULT 'ASSIGNED',
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_ring_user_ring (user_id, ring_id),
  CONSTRAINT fk_users_ring_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_users_ring_ring FOREIGN KEY (ring_id) REFERENCES rings(id)
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

-- Insert default roles
INSERT INTO roles (code, description)
VALUES
  ('USER', 'Standard end-user account'),
  ('SELLER', 'Seller account for product and service management'),
  ('ADMIN', 'Administrator account')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insert default security policies
INSERT INTO security_policies (id, mfa_required, strict_password_policy, session_timeout_minutes, max_login_attempts)
VALUES (1, 1, 1, 30, 5)
ON DUPLICATE KEY UPDATE
  mfa_required = VALUES(mfa_required),
  strict_password_policy = VALUES(strict_password_policy),
  session_timeout_minutes = VALUES(session_timeout_minutes),
  max_login_attempts = VALUES(max_login_attempts);

