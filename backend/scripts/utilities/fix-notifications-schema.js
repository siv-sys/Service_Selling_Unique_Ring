const mysql = require('mysql2/promise');
const env = require('./src/config/env');

async function fixDatabaseSchema() {
  try {
    const connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
    });

    console.log('\n🔧 Fixing Database Schema...\n');

    // Check if metadata column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'notifications' 
        AND COLUMN_NAME = 'metadata'
    `, [env.db.database]);

    if (columns.length === 0) {
      console.log('⚠️  metadata column missing from notifications table');
      console.log('📝 Adding metadata column...');
      
      await connection.execute(`
        ALTER TABLE notifications 
        ADD COLUMN metadata JSON NULL AFTER message
      `);
      
      console.log('✅ metadata column added successfully!');
    } else {
      console.log('✅ metadata column already exists');
    }

    // Verify the fix
    console.log('\n📊 Verifying notifications table structure...');
    const [structure] = await connection.execute(`
      DESCRIBE notifications
    `);

    console.log('\nNotifications table columns:');
    structure.forEach(col => {
      const isMetadata = col.Field === 'metadata';
      console.log(`  ${isMetadata ? '✅' : '  '} ${col.Field} (${col.Type})`);
    });

    console.log('\n✨ Database schema is now up to date!\n');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDatabaseSchema();
