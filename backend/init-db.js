const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const env = require('./src/config/env');

async function initDatabase() {
  let connection;

  try {
    // Connect to MySQL without database first
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      multipleStatements: true
    });

    console.log('Connected to MySQL server');

    // Create database
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${env.db.database}`);
    console.log(`Database ${env.db.database} created or already exists`);

    await connection.end();

    // Connect to the specific database with multiple statements enabled
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      multipleStatements: true
    });

    console.log(`Connected to ${env.db.database} database`);

    // Read and execute schema - use query instead of execute for multiple statements
    const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
    let schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Clean the SQL
    schemaSQL = schemaSQL.replace(/CREATE DATABASE IF NOT EXISTS.*$/gm, '');
    schemaSQL = schemaSQL.replace(/^USE .*$/gm, '');
    schemaSQL = schemaSQL.replace(/SET NAMES.*$/gm, '');
    schemaSQL = schemaSQL.replace(/SET time_zone.*$/gm, '');
    schemaSQL = schemaSQL.replace(/^\s*$/gm, '');

    // Execute the entire schema as one query with multipleStatements
    const results = await connection.query(schemaSQL);
    console.log('Schema executed successfully');

    // Insert sample data
    await insertSampleData(connection);
    console.log('Sample data inserted successfully');

    await connection.end();
    console.log('Database initialization completed!');

  } catch (error) {
    console.error('Database initialization failed:', error);
    if (connection) await connection.end();
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
  console.log('Inserted roles');

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
  console.log('Inserted users');

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
  if (alex && adminRole) {
    await connection.execute(`INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`, [alex.id, adminRole.id]);
  }
  if (jordan && sellerRole) {
    await connection.execute(`INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`, [jordan.id, sellerRole.id]);
  }
  for (const user of [sam, casey, taylor, morgan]) {
    if (user && userRole) {
      await connection.execute(`INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`, [user.id, userRole.id]);
    }
  }
  console.log('Inserted user_roles');

  // Insert ring models
  await connection.execute(`
    INSERT IGNORE INTO ring_models (model_name, description, material, base_price) VALUES 
    ('SmartRing Lover Edition', 'Premium couples ring with advanced features', 'Gold', 499.99),
    ('SmartRing Classic', 'Basic model for everyday use', 'Silver', 299.99),
    ('SmartRing Pro', 'Professional model with extended battery life', 'Titanium', 699.99)
  `);
  console.log('Inserted ring_models');

  // Get ring model ID
  const [models] = await connection.execute('SELECT id, model_name FROM ring_models LIMIT 1');
  const modelId = models[0]?.id;

  // Insert rings
  if (modelId) {
    await connection.execute(`INSERT IGNORE INTO rings (ring_identifier, ring_name, model_id, status, material, price) VALUES ('SR001', 'Alex & Jordan Ring', ?, 'ASSIGNED', 'Gold', 550.00)`, [modelId]);
    await connection.execute(`INSERT IGNORE INTO rings (ring_identifier, ring_name, model_id, status, material, price) VALUES ('SR002', 'Sam & Casey Ring', ?, 'ASSIGNED', 'Silver', 350.00)`, [modelId]);
    await connection.execute(`INSERT IGNORE INTO rings (ring_identifier, ring_name, model_id, status, material, price) VALUES ('SR003', 'Taylor & Morgan Ring', ?, 'ASSIGNED', 'Titanium', 750.00)`, [modelId]);
    await connection.execute(`INSERT IGNORE INTO rings (ring_identifier, ring_name, model_id, status, material, price) VALUES ('SR004', 'Available Ring 1', ?, 'AVAILABLE', 'Gold', 550.00)`, [modelId]);
    await connection.execute(`INSERT IGNORE INTO rings (ring_identifier, ring_name, model_id, status, material, price) VALUES ('SR005', 'Available Ring 2', ?, 'AVAILABLE', 'Silver', 350.00)`, [modelId]);
  }
  console.log('Inserted rings');

  // Insert relationship pairs (only if we have users)
  if (alex) {
    await connection.execute(`INSERT IGNORE INTO relationship_pairs (pair_code, status, created_by_user_id) VALUES ('PAIR001', 'CONNECTED', ?)`, [alex.id]);
  }
  if (jordan) {
    await connection.execute(`INSERT IGNORE INTO relationship_pairs (pair_code, status, created_by_user_id) VALUES ('PAIR002', 'SYNCING', ?)`, [jordan.id]);
  }
  if (sam) {
    await connection.execute(`INSERT IGNORE INTO relationship_pairs (pair_code, status, created_by_user_id) VALUES ('PAIR003', 'PENDING', ?)`, [sam.id]);
  }
  console.log('Inserted relationship_pairs');

  // Get pair IDs
  const [pairs] = await connection.execute('SELECT id, pair_code FROM relationship_pairs');
  const pair1 = pairs.find(p => p.pair_code === 'PAIR001');
  const pair2 = pairs.find(p => p.pair_code === 'PAIR002');
  const pair3 = pairs.find(p => p.pair_code === 'PAIR003');

  // Insert pair members
  if (pair1 && alex && jordan) {
    await connection.execute(`INSERT IGNORE INTO pair_members (pair_id, user_id, member_role) VALUES (?, ?, 'OWNER')`, [pair1.id, alex.id]);
    await connection.execute(`INSERT IGNORE INTO pair_members (pair_id, user_id, member_role) VALUES (?, ?, 'PARTNER')`, [pair1.id, jordan.id]);
  }
  if (pair2 && sam && casey) {
    await connection.execute(`INSERT IGNORE INTO pair_members (pair_id, user_id, member_role) VALUES (?, ?, 'OWNER')`, [pair2.id, sam.id]);
    await connection.execute(`INSERT IGNORE INTO pair_members (pair_id, user_id, member_role) VALUES (?, ?, 'PARTNER')`, [pair2.id, casey.id]);
  }
  if (pair3 && taylor && morgan) {
    await connection.execute(`INSERT IGNORE INTO pair_members (pair_id, user_id, member_role) VALUES (?, ?, 'OWNER')`, [pair3.id, taylor.id]);
    await connection.execute(`INSERT IGNORE INTO pair_members (pair_id, user_id, member_role) VALUES (?, ?, 'PARTNER')`, [pair3.id, morgan.id]);
  }
  console.log('Inserted pair_members');

  // Insert pair invitations
  if (alex && pair1) {
    await connection.execute(`INSERT IGNORE INTO pair_invitations (inviter_user_id, invitee_handle, status, pair_id) VALUES (?, 'jordan', 'ACCEPTED', ?)`, [alex.id, pair1.id]);
  }
  if (sam && pair2) {
    await connection.execute(`INSERT IGNORE INTO pair_invitations (inviter_user_id, invitee_handle, status, pair_id) VALUES (?, 'casey', 'ACCEPTED', ?)`, [sam.id, pair2.id]);
  }
  if (taylor && pair3) {
    await connection.execute(`INSERT IGNORE INTO pair_invitations (inviter_user_id, invitee_handle, status, pair_id) VALUES (?, 'morgan', 'PENDING', ?)`, [taylor.id, pair3.id]);
  }
  console.log('Inserted pair_invitations');

  // Link rings to pairs and users
  const [rings] = await connection.execute('SELECT id, ring_identifier FROM rings');
  const ring1 = rings.find(r => r.ring_identifier === 'SR001');
  const ring2 = rings.find(r => r.ring_identifier === 'SR002');
  const ring3 = rings.find(r => r.ring_identifier === 'SR003');

  if (pair1 && ring1) {
    await connection.execute(`INSERT IGNORE INTO ring_pair_links (pair_id, ring_id, side) VALUES (?, ?, 'A')`, [pair1.id, ring1.id]);
  }
  if (pair1 && ring2) {
    await connection.execute(`INSERT IGNORE INTO ring_pair_links (pair_id, ring_id, side) VALUES (?, ?, 'B')`, [pair1.id, ring2.id]);
  }
  if (pair2 && ring3) {
    await connection.execute(`INSERT IGNORE INTO ring_pair_links (pair_id, ring_id, side) VALUES (?, ?, 'A')`, [pair2.id, ring3.id]);
  }

  // Assign rings to users
  if (alex && ring1) {
    await connection.execute(`INSERT IGNORE INTO users_ring (user_id, ring_id, ring_status) VALUES (?, ?, 'ASSIGNED')`, [alex.id, ring1.id]);
  }
  if (jordan && ring2) {
    await connection.execute(`INSERT IGNORE INTO users_ring (user_id, ring_id, ring_status) VALUES (?, ?, 'ASSIGNED')`, [jordan.id, ring2.id]);
  }
  if (sam && ring3) {
    await connection.execute(`INSERT IGNORE INTO users_ring (user_id, ring_id, ring_status) VALUES (?, ?, 'ASSIGNED')`, [sam.id, ring3.id]);
  }
  console.log('Inserted ring links and user rings');
}

if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };

