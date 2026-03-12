const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupSchema() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    multipleStatements: true,
  });

  console.log('Connected to MySQL server');

  // Read schema file
  const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Split by statement delimiter and filter out comments/empty lines
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('___'));

  console.log(`Executing ${statements.length} statements...\n`);

  for (const statement of statements) {
    try {
      await connection.query(statement);
    } catch (err) {
      // Ignore duplicate column/table errors
      if (!err.message.includes('already exists') && !err.message.includes('Duplicate')) {
        console.log(`Warning: ${err.message.substring(0, 100)}...`);
      }
    }
  }

  console.log('Schema executed successfully!\n');

  // Show tables
  await connection.query('USE ring_app');
  const [tables] = await connection.query('SHOW TABLES');
  console.log('Tables in ring_app:');
  tables.forEach(table => {
    console.log(`  - ${Object.values(table)[0]}`);
  });

  await connection.end();
  console.log('\nDatabase setup complete!');
}

setupSchema().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
