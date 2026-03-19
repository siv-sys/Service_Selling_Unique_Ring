const express = require('express');
const { execute, query } = require('../config/db');

const router = express.Router();

function buildDefaultCatalog() {
  return [
    {
      modelName: 'Eternal Bond Gold',
      collectionName: 'Classic Series',
      material: '18K Gold',
      description: 'Premium gold couple ring set with engraved inner band.',
      imageUrl:
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&h=800&fit=crop',
      basePrice: 1200,
      currencyCode: 'USD',
      ringNamePrefix: 'Eternal Bond Gold',
      ringIdentifierPrefix: 'EBG',
      stockCount: 2,
      startingNumber: 1,
      defaultSize: '7',
      locationLabel: 'Main Warehouse',
    },
    {
      modelName: 'Twin Souls Silver',
      collectionName: 'Modern Series',
      material: 'Sterling Silver',
      description: 'Minimalist silver pair with hammered finish.',
      imageUrl:
        'https://images.unsplash.com/photo-1598560917505-59a3ad559071?q=80&w=600&h=800&fit=crop',
      basePrice: 850,
      currencyCode: 'USD',
      ringNamePrefix: 'Twin Souls Silver',
      ringIdentifierPrefix: 'TSS',
      stockCount: 2,
      startingNumber: 1,
      defaultSize: '7',
      locationLabel: 'Main Warehouse',
    },
    {
      modelName: 'Vintage Rose Promise',
      collectionName: 'Heritage Series',
      material: 'Rose Gold',
      description: 'Vintage-inspired rose gold design with filigree detail.',
      imageUrl:
        'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&h=800&fit=crop',
      basePrice: 1450,
      currencyCode: 'USD',
      ringNamePrefix: 'Vintage Rose Promise',
      ringIdentifierPrefix: 'VRP',
      stockCount: 1,
      startingNumber: 1,
      defaultSize: '7',
      locationLabel: 'Main Warehouse',
    },
  ];
}

async function ensureCatalogColumns() {
  await execute(`
    ALTER TABLE ring_models
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER description
  `).catch(() => {});

  await execute(`
    ALTER TABLE rings
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER price
  `).catch(() => {});
}

async function ensureRingTables() {
  await execute(`
    CREATE TABLE IF NOT EXISTS ring_models (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      model_name VARCHAR(120) NOT NULL,
      collection_name VARCHAR(120) NULL,
      material VARCHAR(80) NOT NULL,
      description TEXT NULL,
      image_url VARCHAR(500) NULL,
      base_price DECIMAL(12,2) NOT NULL,
      currency_code CHAR(3) NOT NULL DEFAULT 'USD',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS rings (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      ring_identifier VARCHAR(60) NOT NULL UNIQUE,
      ring_name VARCHAR(120) NOT NULL,
      model_id BIGINT NULL,
      batch_id BIGINT NULL,
      size VARCHAR(20) NULL,
      material VARCHAR(80) NOT NULL,
      status ENUM('AVAILABLE', 'RESERVED', 'ASSIGNED', 'LOST', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
      location_type ENUM('WAREHOUSE', 'USER', 'TRANSIT', 'SERVICE') NOT NULL DEFAULT 'WAREHOUSE',
      location_label VARCHAR(120) NULL,
      battery_level TINYINT NULL,
      last_seen_at DATETIME NULL,
      last_seen_lat DECIMAL(9,6) NULL,
      last_seen_lng DECIMAL(9,6) NULL,
      price DECIMAL(12,2) NOT NULL,
      image_url VARCHAR(500) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_rings_model_id (model_id)
    ) ENGINE=InnoDB
  `);

  await ensureCatalogColumns();
}

async function findOrCreateModel(item) {
  const existing = await query(
    `
      SELECT id
      FROM ring_models
      WHERE model_name = ?
      LIMIT 1
    `,
    [item.modelName],
  );

  if (existing.length) {
    await execute(
      `
        UPDATE ring_models
        SET collection_name = ?, material = ?, description = ?, image_url = ?, base_price = ?, currency_code = ?
        WHERE id = ?
      `,
      [
        item.collectionName,
        item.material,
        item.description,
        item.imageUrl,
        item.basePrice,
        item.currencyCode,
        existing[0].id,
      ],
    );
    return existing[0].id;
  }

  const result = await execute(
    `
      INSERT INTO ring_models (model_name, collection_name, material, description, image_url, base_price, currency_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      item.modelName,
      item.collectionName,
      item.material,
      item.description,
      item.imageUrl,
      item.basePrice,
      item.currencyCode,
    ],
  );

  return result.insertId;
}

async function createRingsForModel(modelId, item) {
  const stockCount = Math.max(1, Number(item.stockCount || 1));
  const startingNumber = Math.max(1, Number(item.startingNumber || 1));
  let createdRings = 0;

  for (let index = 0; index < stockCount; index += 1) {
    const sequence = String(startingNumber + index).padStart(3, '0');
    const ringIdentifier = `${item.ringIdentifierPrefix}-${sequence}`;
    const existingRing = await query('SELECT id FROM rings WHERE ring_identifier = ? LIMIT 1', [ringIdentifier]);
    if (existingRing.length) {
      continue;
    }

    await execute(
      `
        INSERT INTO rings (
          ring_identifier,
          ring_name,
          model_id,
          size,
          material,
          price,
          status,
          location_type,
          location_label,
          image_url
        )
        VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', 'WAREHOUSE', ?, ?)
      `,
      [
        ringIdentifier,
        `${item.ringNamePrefix} ${sequence}`,
        modelId,
        item.defaultSize,
        item.material,
        item.basePrice,
        item.locationLabel,
        item.imageUrl,
      ],
    );
    createdRings += 1;
  }

  return createdRings;
}

router.post('/seed-catalog', async (req, res, next) => {
  try {
    await ensureRingTables();

    const requestBody = req.body || {};
    const requestedModelName = String(requestBody.modelName || '').trim();
    const catalogItems = requestedModelName
      ? [
          {
            modelName: requestedModelName,
            collectionName: String(requestBody.collectionName || '').trim() || null,
            material: String(requestBody.material || '').trim(),
            description: String(requestBody.description || '').trim() || null,
            imageUrl: String(requestBody.imageUrl || '').trim() || null,
            basePrice: Number(requestBody.basePrice),
            currencyCode: String(requestBody.currencyCode || 'USD').trim().toUpperCase(),
            ringNamePrefix: String(requestBody.ringNamePrefix || requestedModelName).trim(),
            ringIdentifierPrefix: String(requestBody.ringIdentifierPrefix || requestedModelName.slice(0, 3) || 'RNG')
              .trim()
              .toUpperCase(),
            stockCount: Number(requestBody.stockCount || 1),
            startingNumber: Number(requestBody.startingNumber || 1),
            defaultSize: String(requestBody.defaultSize || '7').trim(),
            locationLabel: String(requestBody.locationLabel || 'Main Warehouse').trim(),
          },
        ]
      : buildDefaultCatalog();

    if (
      requestedModelName &&
      (!catalogItems[0].material || !Number.isFinite(catalogItems[0].basePrice) || catalogItems[0].basePrice <= 0)
    ) {
      return res.status(400).json({ message: 'modelName, material, and a valid basePrice are required.' });
    }

    let createdModels = 0;
    let createdRings = 0;

    for (const item of catalogItems) {
      const existingModels = await query('SELECT id FROM ring_models WHERE model_name = ? LIMIT 1', [item.modelName]);
      const modelId = await findOrCreateModel(item);
      if (!existingModels.length) {
        createdModels += 1;
      }
      createdRings += await createRingsForModel(modelId, item);
    }

    return res.json({
      message: requestedModelName ? 'Catalog item inserted successfully.' : 'Catalog seeded successfully.',
      createdModels,
      createdRings,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
