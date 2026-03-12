const mysql = require('mysql2/promise');

async function setupDatabase() {
  // First connect without database to create it if needed
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
  });

  console.log('Connected to MySQL server');

  // Create database if not exists
  await connection.query('CREATE DATABASE IF NOT EXISTS ring_app');
  console.log('Database ring_app created or already exists');

  // Use the database
  await connection.query('USE ring_app');
  console.log('Using ring_app database');

  // Show tables
  const [tables] = await connection.query('SHOW TABLES');
  console.log('\nExisting tables:');
  tables.forEach(table => {
    console.log(`  - ${Object.values(table)[0]}`);
  });

  await connection.end();
  console.log('\nDatabase connection successful!');
}

setupDatabase().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
