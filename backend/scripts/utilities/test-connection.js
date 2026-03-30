const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'root',
      password: '',
      database: 'ring_app'
    });
    
    console.log('✅ Successfully connected to MySQL!');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM rings');
    console.log(`📊 Total rings in database: ${rows[0].count}`);
    
    const [models] = await connection.execute('SELECT * FROM ring_models');
    console.log(`📊 Total ring models: ${models.length}`);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

testConnection();