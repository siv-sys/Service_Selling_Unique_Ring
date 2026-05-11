const mysql = require('mysql2/promise');
const env = require('../../src/config/env');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
    });

    console.log(`Successfully connected to MySQL database: ${env.db.database}`);

    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM rings');
    console.log(`Total rings in database: ${rows[0].count}`);

    const [models] = await connection.execute('SELECT * FROM ring_models');
    console.log(`Total ring models: ${models.length}`);

    await connection.end();
    return true;
  } catch (error) {
    console.error('Connection failed:', error.message);
    return false;
  }
}

testConnection();
