const mysql = require('mysql2/promise');
const env = require('../src/config/env');

function slugPart(value, fallback) {
  return String(value || fallback || 'ITEM')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || fallback;
}

async function seedRings() {
  console.log('Seeding rings data...');

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  });

  try {
    await connection.execute(`
      ALTER TABLE ring_models
      ADD UNIQUE KEY uq_ring_models_model_name (model_name)
    `).catch(() => {});

    const models = [
      {
        model_name: 'Eternal Bond',
        collection_name: 'Classic Series',
        material: '18K Gold',
        description: 'A timeless symbol of eternal love, crafted in premium 18K gold.',
        image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&h=800&fit=crop',
        base_price: 1299.99,
      },
      {
        model_name: 'Infinity Promise',
        collection_name: 'Modern Series',
        material: 'Platinum',
        description: 'Sleek platinum band with infinity design, perfect for modern couples.',
        image_url: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?q=80&w=600&h=800&fit=crop',
        base_price: 2499.99,
      },
      {
        model_name: 'Vintage Rose',
        collection_name: 'Heritage Series',
        material: 'Rose Gold',
        description: 'Vintage-inspired rose gold ring with delicate filigree details.',
        image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&h=800&fit=crop',
        base_price: 1899.99,
      },
      {
        model_name: 'Twin Souls',
        collection_name: 'Minimalist Collection',
        material: 'Sterling Silver',
        description: 'Minimalist sterling silver bands, perfect for everyday wear.',
        image_url: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=600&h=800&fit=crop',
        base_price: 599.99,
      },
      {
        model_name: 'Celestial Halo',
        collection_name: 'Diamond Collection',
        material: 'White Gold',
        description: 'Stunning halo design with brilliant diamonds surrounding the center stone.',
        image_url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600&h=800&fit=crop',
        base_price: 3299.99,
      },
    ];

    for (const model of models) {
      await connection.execute(
        `
          INSERT INTO ring_models
            (model_name, collection_name, material, description, image_url, base_price, currency_code)
          VALUES (?, ?, ?, ?, ?, ?, 'USD')
          ON DUPLICATE KEY UPDATE
            collection_name = VALUES(collection_name),
            material = VALUES(material),
            description = VALUES(description),
            image_url = VALUES(image_url),
            base_price = VALUES(base_price),
            currency_code = VALUES(currency_code)
        `,
        [
          model.model_name,
          model.collection_name,
          model.material,
          model.description,
          model.image_url,
          model.base_price,
        ],
      );
    }

    console.log('Ring models seeded');

    await connection.execute(
      `
        INSERT INTO ring_batches (batch_code, manufactured_at, notes)
        VALUES (?, DATE_SUB(NOW(), INTERVAL 30 DAY), ?)
        ON DUPLICATE KEY UPDATE notes = VALUES(notes)
      `,
      ['BATCH-2026-001', 'Initial local development batch'],
    );

    const [modelRows] = await connection.execute(
      'SELECT id, model_name, material, base_price, image_url FROM ring_models ORDER BY id ASC',
    );

    let createdRings = 0;
    const sizes = ['5', '6', '7', '8', '9', '10'];

    for (const model of modelRows) {
      for (let index = 0; index < 3; index += 1) {
        const size = sizes[index % sizes.length];
        const identifier = `${slugPart(model.model_name, 'RNG').slice(0, 3)}-${String(index + 1).padStart(3, '0')}`;
        const [existingRows] = await connection.execute(
          'SELECT id FROM rings WHERE ring_identifier = ? LIMIT 1',
          [identifier],
        );

        if (existingRows.length) {
          continue;
        }

        await connection.execute(
          `
            INSERT INTO rings
              (ring_identifier, ring_name, model_id, size, material, price, status, location_type, location_label, image_url)
            VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', 'WAREHOUSE', 'Main Warehouse', ?)
          `,
          [
            identifier,
            `${model.model_name} Ring`,
            model.id,
            size,
            model.material,
            Number(model.base_price) + index * 100,
            model.image_url,
          ],
        );
        createdRings += 1;
      }
    }

    console.log(`${createdRings} rings seeded`);

    await connection.execute('DELETE FROM inventory_items');
    const [inventoryRows] = await connection.execute(`
      SELECT
        rm.model_name,
        rm.material,
        rm.image_url,
        COALESCE(NULLIF(r.size, ''), '7') AS size,
        SUM(CASE WHEN r.status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_qty
      FROM ring_models rm
      JOIN rings r ON r.model_id = rm.id
      GROUP BY rm.id, rm.model_name, rm.material, rm.image_url, COALESCE(NULLIF(r.size, ''), '7')
      ORDER BY rm.id, size
    `);

    for (const item of inventoryRows) {
      const stockQty = Number(item.available_qty || 0);
      const status = stockQty === 0 ? 'Depleted' : stockQty <= 5 ? 'Low Stock' : 'In Stock';
      const statusColor = stockQty === 0 ? 'rose' : stockQty <= 5 ? 'amber' : 'emerald';
      const modelKey = slugPart(item.model_name, 'MODEL');
      const materialKey = slugPart(item.material, 'MATERIAL');
      const sizeKey = slugPart(item.size, 'SIZE');

      await connection.execute(
        `
          INSERT INTO inventory_items
            (image_url, model_name, color, variant, sku, serial_number, status, stock_qty, stock_percent, status_color)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          item.image_url,
          item.model_name,
          item.material,
          `Size ${item.size} - ${item.material}`,
          `SKU-${modelKey}-${sizeKey}`,
          `INV-${modelKey}-${materialKey}-${sizeKey}`,
          status,
          stockQty,
          stockQty === 0 ? 0 : Math.min(100, stockQty * 20),
          statusColor,
        ],
      );
    }

    console.log(`${inventoryRows.length} inventory items synced`);
    console.log('Database product data is ready');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  seedRings();
}

module.exports = { seedRings };
