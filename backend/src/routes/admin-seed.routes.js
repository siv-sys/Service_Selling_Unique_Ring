const express = require('express');
const { query, execute } = require('../config/db');

const router = express.Router();

// Get seed status - check which tables have data
router.get('/status', async (req, res) => {
  try {
    const tables = ['users', 'ring_models', 'rings', 'relationship_pairs', 'ring_batches'];
    const status = {};

    for (const table of tables) {
      try {
        const rows = await query(`SELECT COUNT(*) as count FROM ${table}`);
        status[table] = {
          exists: true,
          count: rows[0]?.count || 0,
        };
      } catch (error) {
        status[table] = {
          exists: false,
          error: error.message,
        };
      }
    }

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Seed ring models
router.post('/ring-models', async (req, res) => {
  try {
    const { models } = req.body;
    
    const defaultModels = [
      {
        model_name: 'Elysian Halo',
        collection_name: 'Classic Series',
        material: '18k white gold',
        description: 'Elegant halo design with brilliant cut diamonds',
        image_url: 'https://jewelemarket.com/cdn/shop/products/1506902.jpg?v=1749642089&width=900',
        base_price: 2500.00,
        currency_code: 'USD',
      },
      {
        model_name: 'Midnight Sapphire',
        collection_name: 'Premium Series',
        material: 'platinum',
        description: 'Deep blue sapphire center stone with diamond accents',
        image_url: 'https://loforay.com/cdn/shop/products/O1CN01yJYHgs1uzyLnogHKq__3222026109-0-cib.jpg?v=1677245225',
        base_price: 3200.00,
        currency_code: 'USD',
      },
      {
        model_name: 'Rose Pavé',
        collection_name: 'Romance Series',
        material: 'rose gold',
        description: 'Delicate pavé setting with pink gold band',
        image_url: 'https://esdomera.com/cdn/shop/files/classic-pink-morganite-leaf-floral-engagement-his-and-hers-wedding-ring-pink-yellow-gold-promise-couple-rings-esdomera-2_1800x1800.png?v=1743672938',
        base_price: 1800.00,
        currency_code: 'USD',
      },
      {
        model_name: 'Platinum Solitaire',
        collection_name: 'Classic Series',
        material: '950 platinum',
        description: 'Timeless solitaire design with premium platinum',
        image_url: 'https://m.media-amazon.com/images/I/61btVGnRO6L._AC_UF894,1000_QL80_.jpg',
        base_price: 4500.00,
        currency_code: 'USD',
      },
      {
        model_name: 'Eternal Bond Gold',
        collection_name: 'Classic Series',
        material: '18K Gold',
        description: 'Premium gold couple ring set with engraved inner band',
        image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&h=800&fit=crop',
        base_price: 1200.00,
        currency_code: 'USD',
      },
      {
        model_name: 'Twin Souls Silver',
        collection_name: 'Modern Series',
        material: 'Sterling Silver',
        description: 'Minimalist silver pair with hammered finish',
        image_url: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?q=80&w=600&h=800&fit=crop',
        base_price: 850.00,
        currency_code: 'USD',
      },
    ];

    const modelsToInsert = models || defaultModels;
    const results = [];

    for (const model of modelsToInsert) {
      const result = await execute(
        `INSERT INTO ring_models (model_name, collection_name, material, description, image_url, base_price, currency_code)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         collection_name = VALUES(collection_name),
         material = VALUES(material),
         description = VALUES(description),
         image_url = VALUES(image_url),
         base_price = VALUES(base_price)`,
        [
          model.model_name,
          model.collection_name,
          model.material,
          model.description,
          model.image_url,
          model.base_price,
          model.currency_code,
        ]
      );
      results.push({
        model_name: model.model_name,
        inserted: result.affectedRows > 0,
        id: result.insertId,
      });
    }

    res.json({
      success: true,
      message: `Seeded ${results.length} ring models`,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Seed ring inventory
router.post('/rings', async (req, res) => {
  try {
    const { rings } = req.body;
    
    // Get existing models to link rings
    const models = await query('SELECT id, model_name, material, base_price FROM ring_models');
    
    if (models.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No ring models found. Please seed ring models first.',
      });
    }

    const defaultRings = [];
    let identifier = 1;

    // Create 3-5 rings for each model
    for (const model of models) {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        defaultRings.push({
          ring_identifier: `RNG-${String(identifier).padStart(4, '0')}`,
          ring_name: `${model.model_name} ${String.fromCharCode(65 + i)}`,
          model_id: model.id,
          batch_id: null,
          size: String(5 + Math.floor(Math.random() * 8)),
          material: model.material,
          status: 'AVAILABLE',
          location_type: 'WAREHOUSE',
          location_label: 'Main Warehouse',
          price: model.base_price,
        });
        identifier++;
      }
    }

    const ringsToInsert = rings || defaultRings;
    const results = [];

    for (const ring of ringsToInsert) {
      const result = await execute(
        `INSERT INTO rings (ring_identifier, ring_name, model_id, batch_id, size, material, status, location_type, location_label, price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         ring_name = VALUES(ring_name),
         status = VALUES(status),
         location_type = VALUES(location_type),
         location_label = VALUES(location_label)`,
        [
          ring.ring_identifier,
          ring.ring_name,
          ring.model_id,
          ring.batch_id,
          ring.size,
          ring.material,
          ring.status,
          ring.location_type,
          ring.location_label,
          ring.price,
        ]
      );
      results.push({
        ring_identifier: ring.ring_identifier,
        inserted: result.affectedRows > 0,
        id: result.insertId,
      });
    }

    res.json({
      success: true,
      message: `Seeded ${results.length} rings`,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Seed users with roles
router.post('/users', async (req, res) => {
  try {
    const { users } = req.body;
    
    const defaultUsers = [
      {
        username: 'admin',
        full_name: 'System Administrator',
        email: 'admin@bondkeeper.com',
        password_hash: '$2b$10$YourHashedPasswordHere',
        city: 'New York',
        roles: ['ADMIN'],
      },
      {
        username: 'seller1',
        full_name: 'John Seller',
        email: 'seller@bondkeeper.com',
        password_hash: '$2b$10$YourHashedPasswordHere',
        city: 'Los Angeles',
        roles: ['SELLER'],
      },
      {
        username: 'alex123',
        full_name: 'Alex Johnson',
        email: 'alex@example.com',
        password_hash: '$2b$10$YourHashedPasswordHere',
        city: 'Chicago',
        roles: ['USER'],
      },
      {
        username: 'jamie456',
        full_name: 'Jamie Smith',
        email: 'jamie@example.com',
        password_hash: '$2b$10$YourHashedPasswordHere',
        city: 'Chicago',
        roles: ['USER'],
      },
    ];

    const usersToInsert = users || defaultUsers;
    const results = [];

    for (const user of usersToInsert) {
      const userResult = await execute(
        `INSERT INTO users (username, full_name, email, password_hash, city, account_status)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE')
         ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         city = VALUES(city)`,
        [user.username, user.full_name, user.email, user.password_hash, user.city]
      );

      const userId = userResult.insertId || (await query('SELECT id FROM users WHERE username = ?', [user.username]))[0].id;

      if (user.roles && user.roles.length > 0) {
        for (const roleCode of user.roles) {
          const roleRow = await query('SELECT id FROM roles WHERE code = ?', [roleCode]);
          if (roleRow.length > 0) {
            await execute(
              `INSERT INTO user_roles (user_id, role_id)
               VALUES (?, ?)
               ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP`,
              [userId, roleRow[0].id]
            );
          }
        }
      }

      results.push({
        username: user.username,
        user_id: userId,
        roles: user.roles,
      });
    }

    res.json({
      success: true,
      message: `Seeded ${results.length} users`,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Seed relationship pairs
router.post('/pairs', async (req, res) => {
  try {
    const users = await query('SELECT id, username FROM users WHERE account_status = ?', ['ACTIVE']);
    
    if (users.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Need at least 2 users to create pairs. Please seed users first.',
      });
    }

    const defaultPairs = [
      {
        pair_code: 'PAIR001',
        status: 'CONNECTED',
        user1_id: users[0]?.id,
        user2_id: users[1]?.id,
        established_at: '2025-01-15',
      },
    ];

    if (users.length >= 4) {
      defaultPairs.push({
        pair_code: 'PAIR002',
        status: 'PENDING',
        user1_id: users[2]?.id,
        user2_id: users[3]?.id,
        established_at: null,
      });
    }

    const results = [];

    for (const pair of defaultPairs) {
      if (!pair.user1_id || !pair.user2_id) continue;

      const pairResult = await execute(
        `INSERT INTO relationship_pairs (pair_code, status, created_by_user_id, established_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         established_at = VALUES(established_at)`,
        [pair.pair_code, pair.status, pair.user1_id, pair.established_at]
      );

      const pairId = pairResult.insertId || (await query('SELECT id FROM relationship_pairs WHERE pair_code = ?', [pair.pair_code]))[0].id;

      await execute(
        `INSERT INTO pair_members (pair_id, user_id, member_role)
         VALUES (?, ?, 'OWNER')
         ON DUPLICATE KEY UPDATE member_role = VALUES(member_role)`,
        [pairId, pair.user1_id]
      );

      await execute(
        `INSERT INTO pair_members (pair_id, user_id, member_role)
         VALUES (?, ?, 'PARTNER')
         ON DUPLICATE KEY UPDATE member_role = VALUES(member_role)`,
        [pairId, pair.user2_id]
      );

      results.push({
        pair_code: pair.pair_code,
        pair_id: pairId,
        status: pair.status,
      });
    }

    res.json({
      success: true,
      message: `Seeded ${results.length} relationship pairs`,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
