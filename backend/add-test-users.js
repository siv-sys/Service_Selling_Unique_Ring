const mysql = require('mysql2/promise');
const env = require('./src/config/env');

async function addTestUsers() {
  try {
    // Connect to database
    const connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
    });

    console.log('Connected to database');

    // Check if users already exist
    const [existingUsers] = await connection.execute(
      'SELECT id, email FROM users WHERE email IN (?, ?)',
      ['siv@gmail.com', 'reach@gmail.com']
    );

    if (existingUsers.length > 0) {
      console.log('\nExisting users found:');
      existingUsers.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
      console.log('\nSkipping duplicate inserts...\n');
    }

    // Insert siv@gmail.com if not exists
    const sivExists = existingUsers.find(u => u.email === 'siv@gmail.com');
    if (!sivExists) {
      await connection.execute(`
        INSERT INTO users (username, full_name, email, password_hash, account_status, role)
        VALUES ('siv_user', 'Sav Siv', 'siv@gmail.com', '$2b$10$rH0zKzOzUul5AI3gD9WZu.', 'ACTIVE', 'user')
      `);
      console.log('✅ Created user: siv@gmail.com (Sav Siv)');
    }

    // Insert reach@gmail.com if not exists
    const reachExists = existingUsers.find(u => u.email === 'reach@gmail.com');
    if (!reachExists) {
      await connection.execute(`
        INSERT INTO users (username, full_name, email, password_hash, account_status, role)
        VALUES ('reach_user', 'Reach User', 'reach@gmail.com', '$2b$10$rH0zKzOzUul5AI3gD9WZu.', 'ACTIVE', 'user')
      `);
      console.log('✅ Created user: reach@gmail.com (Reach User)');
    }

    // Get user IDs for verification
    const [users] = await connection.execute(
      'SELECT id, email, full_name FROM users WHERE email IN (?, ?) ORDER BY id',
      ['siv@gmail.com', 'reach@gmail.com']
    );

    console.log('\n📋 User Information:');
    console.log('─'.repeat(50));
    users.forEach(user => {
      console.log(`ID: ${user.id} | Email: ${user.email} | Name: ${user.full_name}`);
    });
    console.log('─'.repeat(50));

    console.log('\n💡 Test Instructions:');
    console.log('1. Login as siv@gmail.com');
    console.log('2. Go to Relationship page');
    console.log('3. Search for "reach" or "reach@gmail.com"');
    console.log('4. Click [Invite] button');
    console.log('5. Logout and login as reach@gmail.com');
    console.log('6. Check notifications - should see invitation');
    console.log('7. Click [Accept Connection] or [Decline]');
    console.log('\n✨ Users are ready for testing!\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTestUsers();
