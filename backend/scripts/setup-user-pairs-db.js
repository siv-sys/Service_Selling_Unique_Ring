const mysql = require('mysql2/promise');

async function setupUserPairsDB() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
  });

  await conn.query('USE ring_app');
  console.log('Using ring_app database\n');

  // Create relationship_pairs table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_pairs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      pair_code VARCHAR(30) NOT NULL UNIQUE,
      pair_name VARCHAR(120) NULL,
      status ENUM('PENDING', 'CONNECTED', 'SYNCING', 'SUSPENDED', 'UNPAIRED') NOT NULL DEFAULT 'PENDING',
      access_level ENUM('FULL_ACCESS', 'LIMITED', 'REVOKED') NOT NULL DEFAULT 'FULL_ACCESS',
      established_at DATE NULL,
      created_by_user_id BIGINT UNSIGNED NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_created_by (created_by_user_id)
    ) ENGINE=InnoDB
  `);
  console.log('✓ user_pairs table created');

  // Create pair_members table (without FK constraints if users table differs)
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS pair_members (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        pair_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        member_role ENUM('OWNER', 'PARTNER') NOT NULL DEFAULT 'PARTNER',
        joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_pair_user (pair_id, user_id),
        INDEX idx_pair_id (pair_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB
    `);
    console.log('✓ pair_members table created');
  } catch (err) {
    console.log('Note:', err.message);
  }

  // Create pair_invitations table
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS pair_invitations (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        pair_id BIGINT UNSIGNED NOT NULL,
        inviter_user_id BIGINT UNSIGNED NOT NULL,
        invitee_user_id BIGINT UNSIGNED NULL,
        invitee_email VARCHAR(190) NULL,
        invitee_username VARCHAR(50) NULL,
        invitation_token VARCHAR(64) NOT NULL UNIQUE,
        status ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
        expires_at DATETIME NOT NULL,
        responded_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pair_id (pair_id),
        INDEX idx_invitee_user (invitee_user_id),
        INDEX idx_token (invitation_token),
        INDEX idx_status (status)
      ) ENGINE=InnoDB
    `);
    console.log('✓ pair_invitations table created');
  } catch (err) {
    console.log('Note:', err.message);
  }

  // Create pair_activities table for logging
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS pair_activities (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        pair_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NULL,
        activity_type VARCHAR(50) NOT NULL,
        activity_data JSON NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pair_id (pair_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB
    `);
    console.log('✓ pair_activities table created');
  } catch (err) {
    console.log('Note:', err.message);
  }

  console.log('\n✅ User Pairs database setup complete!');
  await conn.end();
}

setupUserPairsDB().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
