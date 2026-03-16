const mysql = require('mysql2/promise');

async function setupUserPairsComplete() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
  });

  await conn.query('USE ring_app');
  console.log('Using ring_app database\n');

  // ============================================
  // 1. USER_PAIRS - Main pair information
  // ============================================
  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_pairs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      pair_code VARCHAR(30) NOT NULL UNIQUE,
      pair_name VARCHAR(120) NULL,
      pair_description TEXT NULL,
      status ENUM('PENDING', 'CONNECTED', 'SYNCING', 'SUSPENDED', 'UNPAIRED', 'DISSOLVED') NOT NULL DEFAULT 'PENDING',
      access_level ENUM('FULL_ACCESS', 'LIMITED', 'REVOKED') NOT NULL DEFAULT 'FULL_ACCESS',
      
      -- Relationship metadata
      relationship_type ENUM('ROMANTIC', 'FRIENDSHIP', 'FAMILY', 'OTHER') DEFAULT 'ROMANTIC',
      established_at DATE NULL,
      anniversary_date DATE NULL,
      
      -- Sync & Connection settings
      sync_enabled BOOLEAN DEFAULT TRUE,
      last_sync_at DATETIME NULL,
      connection_strength INT DEFAULT 0 COMMENT '0-100 connection strength score',
      
      -- Security
      encryption_key VARCHAR(255) NULL,
      security_level ENUM('STANDARD', 'HIGH', 'MAXIMUM') DEFAULT 'STANDARD',
      
      -- Timestamps
      created_by_user_id BIGINT UNSIGNED NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      dissolved_at DATETIME NULL,
      
      -- Indexes
      INDEX idx_status (status),
      INDEX idx_created_by (created_by_user_id),
      INDEX idx_established (established_at),
      INDEX idx_access_level (access_level)
    ) ENGINE=InnoDB
  `);
  console.log('✓ user_pairs table created');

  // ============================================
  // 2. PAIR_MEMBERS - Links users to pairs
  // ============================================
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pair_members (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      pair_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT UNSIGNED NOT NULL,
      
      -- Role & Permissions
      member_role ENUM('OWNER', 'PARTNER', 'GUEST') NOT NULL DEFAULT 'PARTNER',
      permissions JSON NULL COMMENT 'Custom permissions as JSON',
      
      -- Member status
      member_status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REMOVED') DEFAULT 'ACTIVE',
      
      -- Ring association
      assigned_ring_id BIGINT UNSIGNED NULL,
      ring_assigned_at DATETIME NULL,
      
      -- Notification preferences
      notify_on_sync BOOLEAN DEFAULT TRUE,
      notify_on_message BOOLEAN DEFAULT TRUE,
      notify_on_proximity BOOLEAN DEFAULT TRUE,
      
      -- Timestamps
      joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_active_at DATETIME NULL,
      removed_at DATETIME NULL,
      
      -- Constraints
      UNIQUE KEY uq_pair_user (pair_id, user_id),
      INDEX idx_pair_id (pair_id),
      INDEX idx_user_id (user_id),
      INDEX idx_member_status (member_status)
    ) ENGINE=InnoDB
  `);
  console.log('✓ pair_members table created');

  // ============================================
  // 3. PAIR_INVITATIONS - Invitation management
  // ============================================
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pair_invitations (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      pair_id BIGINT UNSIGNED NOT NULL,
      
      -- Inviter info
      inviter_user_id BIGINT UNSIGNED NOT NULL,
      
      -- Invitee info (can be by user_id, email, or username)
      invitee_user_id BIGINT UNSIGNED NULL,
      invitee_email VARCHAR(190) NULL,
      invitee_username VARCHAR(50) NULL,
      invitee_phone VARCHAR(20) NULL,
      
      -- Invitation details
      invitation_token VARCHAR(64) NOT NULL UNIQUE,
      invitation_message TEXT NULL,
      
      -- Status tracking
      status ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
      
      -- Expiry & Response
      expires_at DATETIME NOT NULL,
      responded_at DATETIME NULL,
      response_message TEXT NULL,
      
      -- Timestamps
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      cancelled_at DATETIME NULL,
      revoked_by_user_id BIGINT UNSIGNED NULL,
      
      -- Indexes
      INDEX idx_pair_id (pair_id),
      INDEX idx_invitee_user (invitee_user_id),
      INDEX idx_invitee_email (invitee_email),
      INDEX idx_token (invitation_token),
      INDEX idx_status (status),
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB
  `);
  console.log('✓ pair_invitations table created');

  // ============================================
  // 4. PAIR_ACTIVITIES - Activity logging
  // ============================================
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pair_activities (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      pair_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT UNSIGNED NULL,
      
      -- Activity details
      activity_type VARCHAR(50) NOT NULL COMMENT 'e.g., PAIR_CREATED, MEMBER_JOINED, SYNC_COMPLETED',
      activity_category ENUM('SYSTEM', 'USER', 'SYNC', 'SECURITY', 'RELATIONSHIP') DEFAULT 'USER',
      activity_data JSON NULL,
      activity_description TEXT NULL,
      
      -- Metadata
      ip_address VARCHAR(45) NULL,
      user_agent VARCHAR(255) NULL,
      
      -- Timestamps
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      -- Indexes
      INDEX idx_pair_id (pair_id),
      INDEX idx_user_id (user_id),
      INDEX idx_activity_type (activity_type),
      INDEX idx_created_at (created_at),
      INDEX idx_category (activity_category)
    ) ENGINE=InnoDB
  `);
  console.log('✓ pair_activities table created');

  // ============================================
  // 5. PAIR_SYNC_LOGS - Synchronization history
  // ============================================
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pair_sync_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      pair_id BIGINT UNSIGNED NOT NULL,
      
      -- Sync details
      sync_type ENUM('FULL', 'PARTIAL', 'HEARTBEAT', 'MANUAL') DEFAULT 'FULL',
      sync_status ENUM('SUCCESS', 'FAILED', 'IN_PROGRESS', 'TIMEOUT') NOT NULL,
      
      -- Device info
      initiated_by_user_id BIGINT UNSIGNED NOT NULL,
      device_id VARCHAR(100) NULL,
      device_type ENUM('RING', 'MOBILE', 'WEB', 'TABLET') NULL,
      
      -- Sync metrics
      items_synced INT DEFAULT 0,
      items_failed INT DEFAULT 0,
      sync_duration_ms INT NULL,
      
      -- Error tracking
      error_message TEXT NULL,
      error_code VARCHAR(50) NULL,
      
      -- Timestamps
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME NULL,
      
      -- Indexes
      INDEX idx_pair_id (pair_id),
      INDEX idx_initiated_by (initiated_by_user_id),
      INDEX idx_sync_status (sync_status),
      INDEX idx_started_at (started_at)
    ) ENGINE=InnoDB
  `);
  console.log('✓ pair_sync_logs table created');

  // ============================================
  // 6. PAIR_PREFERENCES - Pair-specific settings
  // ============================================
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pair_preferences (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      pair_id BIGINT UNSIGNED NOT NULL UNIQUE,
      
      -- Privacy settings
      share_location BOOLEAN DEFAULT TRUE,
      share_activity BOOLEAN DEFAULT TRUE,
      share_health_data BOOLEAN DEFAULT FALSE,
      
      -- Notification settings
      notify_on_proximity BOOLEAN DEFAULT TRUE,
      proximity_threshold_meters INT DEFAULT 10,
      notify_on_disconnect BOOLEAN DEFAULT TRUE,
      
      -- Sync settings
      auto_sync BOOLEAN DEFAULT TRUE,
      sync_interval_minutes INT DEFAULT 5,
      
      -- Custom preferences (JSON for flexibility)
      custom_preferences JSON NULL,
      
      -- Timestamps
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- Indexes
      INDEX idx_pair_id (pair_id)
    ) ENGINE=InnoDB
  `);
  console.log('✓ pair_preferences table created');

  // ============================================
  // 7. PAIR_MESSAGES - Direct messages between pair members
  // ============================================
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pair_messages (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      pair_id BIGINT UNSIGNED NOT NULL,
      
      -- Message details
      sender_user_id BIGINT UNSIGNED NOT NULL,
      message_type ENUM('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'LOCATION', 'SYSTEM') DEFAULT 'TEXT',
      message_content TEXT NOT NULL,
      
      -- Media attachments
      attachment_url VARCHAR(500) NULL,
      attachment_metadata JSON NULL,
      
      -- Message status
      is_edited BOOLEAN DEFAULT FALSE,
      edited_at DATETIME NULL,
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at DATETIME NULL,
      
      -- Delivery tracking
      delivered_at DATETIME NULL,
      read_at DATETIME NULL,
      
      -- Timestamps
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      -- Indexes
      INDEX idx_pair_id (pair_id),
      INDEX idx_sender (sender_user_id),
      INDEX idx_created_at (created_at),
      INDEX idx_message_type (message_type)
    ) ENGINE=InnoDB
  `);
  console.log('✓ pair_messages table created');

  // ============================================
  // 8. PAIR_PROXIMITY_EVENTS - Proximity detection events
  // ============================================
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pair_proximity_events (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      pair_id BIGINT UNSIGNED NOT NULL,
      
      -- Event details
      user_id BIGINT UNSIGNED NOT NULL,
      event_type ENUM('ENTER_PROXIMITY', 'EXIT_PROXIMITY', 'STAY_IN_PROXIMITY') NOT NULL,
      
      -- Location data
      latitude DECIMAL(10, 8) NULL,
      longitude DECIMAL(11, 8) NULL,
      accuracy_meters INT NULL,
      
      -- Proximity data
      distance_meters INT NULL,
      signal_strength INT NULL,
      
      -- Device info
      device_id VARCHAR(100) NULL,
      
      -- Timestamps
      detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      -- Indexes
      INDEX idx_pair_id (pair_id),
      INDEX idx_user_id (user_id),
      INDEX idx_event_type (event_type),
      INDEX idx_detected_at (detected_at)
    ) ENGINE=InnoDB
  `);
  console.log('✓ pair_proximity_events table created');

  // ============================================
  // 9. PAIR_CONNECTION_HISTORY - Connection quality history
  // ============================================
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pair_connection_history (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      pair_id BIGINT UNSIGNED NOT NULL,
      
      -- Connection metrics
      connection_status ENUM('CONNECTED', 'DISCONNECTED', 'WEAK', 'UNSTABLE') NOT NULL,
      connection_quality_score INT NULL COMMENT '0-100 quality score',
      
      -- Technical details
      latency_ms INT NULL,
      packet_loss_percent DECIMAL(5,2) NULL,
      
      -- Device info
      reported_by_user_id BIGINT UNSIGNED NOT NULL,
      device_battery_level INT NULL,
      
      -- Timestamps
      recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      -- Indexes
      INDEX idx_pair_id (pair_id),
      INDEX idx_status (connection_status),
      INDEX idx_recorded_at (recorded_at)
    ) ENGINE=InnoDB
  `);
  console.log('✓ pair_connection_history table created');

  // ============================================
  // 10. PAIR_ANNIVERSARIES - Special dates tracking
  // ============================================
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pair_anniversaries (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      pair_id BIGINT UNSIGNED NOT NULL,
      
      -- Anniversary details
      anniversary_type ENUM('RELATIONSHIP', 'FIRST_MEET', 'ENGAGEMENT', 'MARRIAGE', 'CUSTOM') NOT NULL,
      anniversary_name VARCHAR(120) NULL,
      anniversary_date DATE NOT NULL,
      
      -- Reminder settings
      remind_before_days INT DEFAULT 7,
      reminder_sent BOOLEAN DEFAULT FALSE,
      reminder_sent_at DATETIME NULL,
      
      -- Metadata
      description TEXT NULL,
      is_recurring BOOLEAN DEFAULT TRUE,
      
      -- Timestamps
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- Indexes
      INDEX idx_pair_id (pair_id),
      INDEX idx_anniversary_date (anniversary_date),
      INDEX idx_anniversary_type (anniversary_type)
    ) ENGINE=InnoDB
  `);
  console.log('✓ pair_anniversaries table created');

  console.log('\n✅ All UserPair tables created successfully!');
  console.log('\nTables created:');
  console.log('  1. user_pairs - Main pair information');
  console.log('  2. pair_members - User to pair associations');
  console.log('  3. pair_invitations - Invitation management');
  console.log('  4. pair_activities - Activity logging');
  console.log('  5. pair_sync_logs - Synchronization history');
  console.log('  6. pair_preferences - Pair settings');
  console.log('  7. pair_messages - Direct messaging');
  console.log('  8. pair_proximity_events - Proximity detection');
  console.log('  9. pair_connection_history - Connection quality');
  console.log('  10. pair_anniversaries - Special dates');

  await conn.end();
}

setupUserPairsComplete().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
