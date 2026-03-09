const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const env = require('./src/config/env');

async function initDatabase() {
  try {
    // Connect to MySQL without database first
    const connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
    });

    console.log('Connected to MySQL server');

    // Create database if not exists
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${env.db.database}`);
    console.log(`Database ${env.db.database} created or already exists`);

    await connection.end();

    // Connect to the specific database
    const dbConnection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
    });

    console.log('Connected to ring_app database');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Remove the CREATE DATABASE and USE statements since we already handled them
    const cleanedSQL = schemaSQL
      .replace(/CREATE DATABASE IF NOT EXISTS ring_app;?/g, '')
      .replace(/USE ring_app;?/g, '')
      .replace(/SET NAMES utf8mb4;?/g, '')
      .replace(/SET time_zone = '\+00:00';?/g, '');

    // Split SQL statements and execute them
    const statements = cleanedSQL.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await dbConnection.execute(statement + ';');
          console.log(`Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          console.error(`Error in statement ${i + 1}:`, statement.substring(0, 100) + '...');
          console.error('Error details:', error.message);
          // Continue with other statements
        }
      }
    }
    console.log('Schema executed successfully');

    // Insert sample data
    await insertSampleData(dbConnection);
    console.log('Sample data inserted successfully');

    await dbConnection.end();
    console.log('Database initialization completed!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

async function insertSampleData(connection) {
  // Insert roles
  await connection.execute(`
    INSERT IGNORE INTO roles (code, description) VALUES 
    ('USER', 'Regular user'),
    ('SELLER', 'Ring seller/manager'),
    ('ADMIN', 'System administrator')
  `);

  // Insert sample users
  await connection.execute(`
    INSERT IGNORE INTO users (username, full_name, email, password_hash, account_status) VALUES 
    ('alex_admin', 'Alex Rivera', 'alex@smartring.com', 'hashed_password_1', 'ACTIVE'),
    ('jordan_seller', 'Jordan Smith', 'jordan@smartring.com', 'hashed_password_2', 'ACTIVE'),
    ('sam_user', 'Sam Johnson', 'sam@smartring.com', 'hashed_password_3', 'ACTIVE'),
    ('casey_user', 'Casey Brown', 'casey@smartring.com', 'hashed_password_4', 'ACTIVE'),
    ('taylor_user', 'Taylor Davis', 'taylor@smartring.com', 'hashed_password_5', 'ACTIVE'),
    ('morgan_user', 'Morgan Wilson', 'morgan@smartring.com', 'hashed_password_6', 'ACTIVE')
  `);

  // Get role IDs
  const [roles] = await connection.execute('SELECT id, code FROM roles');
  const adminRole = roles.find(r => r.code === 'ADMIN');
  const sellerRole = roles.find(r => r.code === 'SELLER');
  const userRole = roles.find(r => r.code === 'USER');

  // Get user IDs
  const [users] = await connection.execute('SELECT id, username FROM users');
  const alex = users.find(u => u.username === 'alex_admin');
  const jordan = users.find(u => u.username === 'jordan_seller');
  const sam = users.find(u => u.username === 'sam_user');
  const casey = users.find(u => u.username === 'casey_user');
  const taylor = users.find(u => u.username === 'taylor_user');
  const morgan = users.find(u => u.username === 'morgan_user');

  // Assign roles
  await connection.execute(`
    INSERT IGNORE INTO user_roles (user_id, role_id) VALUES 
    (?, ?), (?, ?), (?, ?), (?, ?), (?, ?), (?, ?)
  `, [
    alex.id, adminRole.id,
    jordan.id, sellerRole.id,
    sam.id, userRole.id,
    casey.id, userRole.id,
    taylor.id, userRole.id,
    morgan.id, userRole.id
  ]);

  // Insert ring models
  await connection.execute(`
    INSERT IGNORE INTO ring_models (model_name, description) VALUES 
    ('SmartRing Lover Edition', 'Premium couples ring with advanced features'),
    ('SmartRing Classic', 'Basic model for everyday use'),
    ('SmartRing Pro', 'Professional model with extended battery life')
  `);

  // Get ring model IDs
  const [models] = await connection.execute('SELECT id, model_name FROM ring_models');
  const loverModel = models.find(m => m.model_name === 'SmartRing Lover Edition');

  // Insert rings
  await connection.execute(`
    INSERT IGNORE INTO rings (ring_identifier, ring_name, model_id, status) VALUES 
    ('SR001', 'Alex & Jordan Ring', ?, 'ASSIGNED'),
    ('SR002', 'Sam & Casey Ring', ?, 'ASSIGNED'),
    ('SR003', 'Taylor & Morgan Ring', ?, 'ASSIGNED'),
    ('SR004', 'Available Ring 1', ?, 'AVAILABLE'),
    ('SR005', 'Available Ring 2', ?, 'AVAILABLE'),
    ('SR006', 'Maintenance Ring', ?, 'MAINTENANCE')
  `, [
    loverModel.id, loverModel.id, loverModel.id, loverModel.id, loverModel.id, loverModel.id
  ]);

  // Insert relationship pairs
  await connection.execute(`
    INSERT IGNORE INTO relationship_pairs (pair_code, status, created_by_user_id) VALUES 
    ('PAIR001', 'CONNECTED', ?),
    ('PAIR002', 'SYNCING', ?),
    ('PAIR003', 'PENDING', ?)
  `, [alex.id, jordan.id, sam.id]);

  // Get pair IDs
  const [pairs] = await connection.execute('SELECT id, pair_code FROM relationship_pairs');
  const pair1 = pairs.find(p => p.pair_code === 'PAIR001');
  const pair2 = pairs.find(p => p.pair_code === 'PAIR002');
  const pair3 = pairs.find(p => p.pair_code === 'PAIR003');

  // Insert pair members
  await connection.execute(`
    INSERT IGNORE INTO pair_members (pair_id, user_id, member_role) VALUES 
    (?, ?, 'PARTNER_A'), (?, ?, 'PARTNER_B'),
    (?, ?, 'PARTNER_A'), (?, ?, 'PARTNER_B'),
    (?, ?, 'PARTNER_A'), (?, ?, 'PARTNER_B')
  `, [
    pair1.id, alex.id, pair1.id, jordan.id,
    pair2.id, sam.id, pair2.id, casey.id,
    pair3.id, taylor.id, pair3.id, morgan.id
  ]);

  // Get ring IDs
  const [rings] = await connection.execute('SELECT id, ring_identifier FROM rings');
  const ring1 = rings.find(r => r.ring_identifier === 'SR001');
  const ring2 = rings.find(r => r.ring_identifier === 'SR002');
  const ring3 = rings.find(r => r.ring_identifier === 'SR003');

  // Link rings to pairs
  await connection.execute(`
    INSERT IGNORE INTO ring_pair_links (pair_id, ring_id) VALUES 
    (?, ?), (?, ?), (?, ?)
  `, [pair1.id, ring1.id, pair2.id, ring2.id, pair3.id, ring3.id]);

  // Insert pair invitations
  await connection.execute(`
    INSERT IGNORE INTO pair_invitations (inviter_user_id, invitee_handle, status, pair_id) VALUES 
    (?, ?, 'ACCEPTED', ?),
    (?, ?, 'ACCEPTED', ?),
    (?, ?, 'PENDING', ?)
  `, [
    alex.id, 'jordan@smartring.com', pair1.id,
    sam.id, 'casey@smartring.com', pair2.id,
    taylor.id, 'morgan@smartring.com', pair3.id
  ]);
}

if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
