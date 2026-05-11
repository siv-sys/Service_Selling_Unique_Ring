const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const env = require('../../src/config/env');

const TEST_PASSWORD = 'Password123!';

const TEST_USERS = [
  {
    email: 'admin@example.com',
    username: 'admin',
    fullName: 'Admin User',
    role: 'admin',
  },
  {
    email: 'user@example.com',
    username: 'user',
    fullName: 'Test User',
    role: 'user',
  },
  {
    email: 'siv@gmail.com',
    username: 'siv_user',
    fullName: 'Sav Siv',
    role: 'user',
  },
  {
    email: 'reach@gmail.com',
    username: 'reach_user',
    fullName: 'Reach User',
    role: 'user',
  },
];

async function addTestUsers() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  });

  try {
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

    for (const user of TEST_USERS) {
      await connection.execute(
        `
          INSERT INTO users (username, full_name, name, email, password_hash, account_status, role)
          VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
          ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            full_name = VALUES(full_name),
            name = VALUES(name),
            password_hash = VALUES(password_hash),
            account_status = 'ACTIVE',
            role = VALUES(role),
            remember_token = NULL
        `,
        [user.username, user.fullName, user.fullName, user.email, passwordHash, user.role],
      );
    }

    await connection.execute(`
      UPDATE auth_sessions
      SET revoked_at = UTC_TIMESTAMP()
      WHERE revoked_at IS NULL
    `).catch(() => {});

    const [users] = await connection.execute(
      `
        SELECT id, email, full_name, role, account_status
        FROM users
        WHERE email IN (?, ?, ?, ?)
        ORDER BY role, id
      `,
      TEST_USERS.map((user) => user.email),
    );

    console.log('Test users are ready:');
    users.forEach((user) => {
      console.log(`- ${user.email} / ${TEST_PASSWORD} (${user.role})`);
    });
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  addTestUsers().catch((error) => {
    console.error('Error adding test users:', error.message);
    process.exit(1);
  });
}

module.exports = { addTestUsers };
