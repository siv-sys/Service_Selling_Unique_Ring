const mysql = require('mysql2/promise');

async function addSupplier() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
  });

  await conn.query('USE ring_app');

  // Add supplier column to inventory_items if not exists
  try {
    await conn.query(`ALTER TABLE inventory_items ADD COLUMN supplier VARCHAR(120) NULL`);
    console.log('Added supplier column to inventory_items');
  } catch (err) {
    if (err.message.includes('Duplicate')) {
      console.log('supplier column already exists in inventory_items');
    } else {
      console.log('Error adding supplier:', err.message);
    }
  }

  // Add supplier_id to ring_models if not exists
  try {
    await conn.query(`ALTER TABLE ring_models ADD COLUMN supplier_name VARCHAR(120) NULL`);
    console.log('Added supplier_name column to ring_models');
  } catch (err) {
    if (err.message.includes('Duplicate')) {
      console.log('supplier_name column already exists in ring_models');
    } else {
      console.log('Error adding supplier_name:', err.message);
    }
  }

  // Add supplier_id to rings if not exists
  try {
    await conn.query(`ALTER TABLE rings ADD COLUMN supplier_name VARCHAR(120) NULL`);
    console.log('Added supplier_name column to rings');
  } catch (err) {
    if (err.message.includes('Duplicate')) {
      console.log('supplier_name column already exists in rings');
    } else {
      console.log('Error adding supplier_name to rings:', err.message);
    }
  }

  console.log('Done!');
  await conn.end();
}

addSupplier().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
