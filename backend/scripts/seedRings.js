const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function seedRings() {
  console.log('🌱 Seeding rings data...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Insert ring models if not exists
    const models = [
      {
        model_name: 'Eternal Bond',
        collection_name: 'Classic Series',
        material: '18K Gold',
        description: 'A timeless symbol of eternal love, crafted in premium 18K gold.',
        image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&h=800&fit=crop',
        base_price: 1299.99
      },
      {
        model_name: 'Infinity Promise',
        collection_name: 'Modern Series',
        material: 'Platinum',
        description: 'Sleek platinum band with infinity design, perfect for modern couples.',
        image_url: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?q=80&w=600&h=800&fit=crop',
        base_price: 2499.99
      },
      {
        model_name: 'Vintage Rose',
        collection_name: 'Heritage Series',
        material: 'Rose Gold',
        description: 'Vintage-inspired rose gold ring with delicate filigree details.',
        image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&h=800&fit=crop',
        base_price: 1899.99
      },
      {
        model_name: 'Twin Souls',
        collection_name: 'Minimalist Collection',
        material: 'Sterling Silver',
        description: 'Minimalist sterling silver bands, perfect for everyday wear.',
        image_url: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=600&h=800&fit=crop',
        base_price: 599.99
      },
      {
        model_name: 'Celestial Halo',
        collection_name: 'Diamond Collection',
        material: 'White Gold',
        description: 'Stunning halo design with brilliant diamonds surrounding the center stone.',
        image_url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600&h=800&fit=crop',
        base_price: 3299.99
      }
    ];

    for (const model of models) {
      await connection.execute(`
        INSERT INTO ring_models 
        (model_name, collection_name, material, description, image_url, base_price, currency_code)
        VALUES (?, ?, ?, ?, ?, ?, 'USD')
        ON DUPLICATE KEY UPDATE
        model_name = VALUES(model_name)
      `, [model.model_name, model.collection_name, model.material, model.description, model.image_url, model.base_price]);
    }

    console.log('✅ Ring models seeded');

    // Get model IDs
    const [modelRows] = await connection.execute('SELECT id, model_name FROM ring_models');

    // Insert rings (inventory)
    const rings = [];
    
    // Create multiple rings for each model
    for (const model of modelRows) {
      const sizes = ['5', '6', '7', '8', '9', '10'];
      
      for (let i = 0; i < 3; i++) {
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        const identifier = `${model.model_name.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
        
        rings.push([
          identifier,
          `${model.model_name} Ring`,
          model.id,
          null,
          size,
          model.material,
          model.base_price + (i * 100),
          'AVAILABLE',
          'WAREHOUSE',
          'Main Warehouse'
        ]);
      }
    }

    for (const ring of rings) {
      await connection.execute(`
        INSERT INTO rings 
        (ring_identifier, ring_name, model_id, batch_id, size, material, price, status, location_type, location_label)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, ring);
    }

    console.log(`✅ ${rings.length} rings seeded`);

    // Create a batch
    const [batchResult] = await connection.execute(`
      INSERT INTO ring_batches (batch_code, manufactured_at, notes)
      VALUES (?, DATE_SUB(NOW(), INTERVAL 30 DAY), ?)
    `, ['BATCH-2025-001', 'Initial production batch']);

    console.log('✅ Batch created');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await connection.end();
  }
}

seedRings();