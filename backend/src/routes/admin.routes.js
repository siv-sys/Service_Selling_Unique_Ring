const express = require('express');
const { execute, query } = require('../config/db');
const { createNotification } = require('../services/notifications.service');

const router = express.Router();

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

async function ensureInventoryTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      image_url VARCHAR(500) NULL,
      model_name VARCHAR(120) NOT NULL,
      color VARCHAR(80) NULL,
      variant VARCHAR(160) NOT NULL,
      sku VARCHAR(80) NOT NULL UNIQUE,
      serial_number VARCHAR(120) NOT NULL UNIQUE,
      status VARCHAR(40) NOT NULL DEFAULT 'In Stock',
      stock_qty INT UNSIGNED NOT NULL DEFAULT 0,
      stock_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
      status_color VARCHAR(20) NOT NULL DEFAULT 'emerald',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_inventory_model (model_name),
      KEY idx_inventory_color (color),
      KEY idx_inventory_status (status)
    ) ENGINE=InnoDB
  `);
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
  await ensureInventoryTable();
}

function deriveInventoryColor(material) {
  const normalized = String(material || '').toLowerCase();

  if (normalized.includes('rose')) return 'Rose Gold';
  if (normalized.includes('silver')) return 'Silver';
  if (normalized.includes('platinum')) return 'Platinum';
  if (normalized.includes('gold')) return 'Gold';
  return String(material || '').trim() || null;
}

function deriveInventoryState(stockQty) {
  const safeStockQty = Math.max(0, Number(stockQty || 0));

  if (safeStockQty === 0) {
    return { stockQty: 0, stockPercent: 0, status: 'Depleted', statusColor: 'rose' };
  }
  if (safeStockQty <= 5) {
    return { stockQty: safeStockQty, stockPercent: Math.min(100, safeStockQty * 20), status: 'Low Stock', statusColor: 'amber' };
  }
  return { stockQty: safeStockQty, stockPercent: 100, status: 'In Stock', statusColor: 'emerald' };
}

function toInventoryKeyPart(value, fallback) {
  const normalized = String(value || fallback || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  return normalized || String(fallback || 'ITEM').toUpperCase();
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

async function syncInventoryForModel(modelId) {
  const rings = await query(
    `
      SELECT
        r.id,
        r.ring_identifier,
        r.ring_name,
        r.size,
        r.material,
        r.status,
        r.price,
        r.image_url,
        rm.model_name
      FROM rings r
      LEFT JOIN ring_models rm ON rm.id = r.model_id
      WHERE r.model_id = ?
      ORDER BY r.id ASC
    `,
    [modelId],
  );

  if (!rings.length) {
    return 0;
  }

  const ringIdentifiers = rings.map((ring) => ring.ring_identifier).filter(Boolean);
  if (ringIdentifiers.length) {
    const placeholders = ringIdentifiers.map(() => '?').join(', ');
    await execute(
      `
        DELETE FROM inventory_items
        WHERE serial_number IN (${placeholders})
           OR sku IN (${ringIdentifiers.map(() => '?').join(', ')})
      `,
      [...ringIdentifiers, ...ringIdentifiers.map((identifier) => `SKU-${identifier}`)],
    ).catch(() => {});
  }

  const groupedVariants = new Map();

  for (const ring of rings) {
    const modelName = ring.model_name || ring.ring_name;
    const size = ring.size || 'N/A';
    const material = ring.material || 'Unknown';
    const imageUrl = ring.image_url || null;
    const groupKey = `${modelName}::${size}::${material}`;
    const existingGroup = groupedVariants.get(groupKey) || {
      modelName,
      size,
      material,
      imageUrl,
      totalQty: 0,
      availableQty: 0,
    };

    existingGroup.totalQty += 1;
    if (String(ring.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE') {
      existingGroup.availableQty += 1;
    }
    if (!existingGroup.imageUrl && imageUrl) {
      existingGroup.imageUrl = imageUrl;
    }

    groupedVariants.set(groupKey, existingGroup);
  }

  let syncedInventoryItems = 0;

  for (const group of groupedVariants.values()) {
    const variant = `Size ${group.size} - ${group.material}`;
    const inventoryState = deriveInventoryState(group.availableQty);
    const sku = `SKU-${toInventoryKeyPart(group.modelName, 'MODEL')}-${toInventoryKeyPart(group.size, 'SIZE')}`;
    const serialNumber = `INV-${modelId}-${toInventoryKeyPart(group.material, 'MAT')}-${toInventoryKeyPart(group.size, 'SIZE')}`;

    const existingInventory = await query(
      `
        SELECT id
        FROM inventory_items
        WHERE sku = ?
           OR serial_number = ?
        LIMIT 1
      `,
      [sku, serialNumber],
    );

    if (existingInventory.length) {
      await execute(
        `
          UPDATE inventory_items
          SET image_url = ?,
              model_name = ?,
              color = ?,
              variant = ?,
              sku = ?,
              serial_number = ?,
              status = ?,
              stock_qty = ?,
              stock_percent = ?,
              status_color = ?
          WHERE id = ?
        `,
        [
          group.imageUrl,
          group.modelName,
          deriveInventoryColor(group.material),
          variant,
          sku,
          serialNumber,
          inventoryState.status,
          inventoryState.stockQty,
          inventoryState.stockPercent,
          inventoryState.statusColor,
          existingInventory[0].id,
        ],
      );
    } else {
      await execute(
        `
          INSERT INTO inventory_items (
            image_url,
            model_name,
            color,
            variant,
            sku,
            serial_number,
            status,
            stock_qty,
            stock_percent,
            status_color
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          group.imageUrl,
          group.modelName,
          deriveInventoryColor(group.material),
          variant,
          sku,
          serialNumber,
          inventoryState.status,
          inventoryState.stockQty,
          inventoryState.stockPercent,
          inventoryState.statusColor,
        ],
      );
    }

    syncedInventoryItems += 1;
  }

  return syncedInventoryItems;
}

async function notifyUsersAboutCatalogItem(item, createdRings) {
  const users = await query(
    `
      SELECT id
      FROM users
      WHERE role = 'user'
        AND COALESCE(account_status, 'ACTIVE') = 'ACTIVE'
    `
  );

  if (!users.length) {
    return 0;
  }

  const notificationType = 'catalog_update';
  const eventStamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const title = `New Ring Added: ${item.modelName} [${eventStamp}]`;
  const message = `${item.modelName} (${item.material}) is now available in Couple Shop${createdRings > 0 ? ` with ${createdRings} unit(s) in stock` : ''}.`;
  const metadata = {
    modelName: item.modelName,
    material: item.material,
    basePrice: item.basePrice,
    createdRings,
    createdAt: new Date().toISOString(),
  };

  let sentCount = 0;
  for (const user of users) {
    try {
      await createNotification({
        userId: user.id,
        type: notificationType,
        icon: '\u{1F48D}',
        iconClass: 'system',
        actionKey: 'catalog_seed_new_item',
        title,
        message,
        unread: true,
        metadata,
      });
      sentCount += 1;
    } catch (error) {
      // Ignore duplicate notification key collisions and continue sending to other users.
      if (!String(error?.message || '').toLowerCase().includes('duplicate')) {
        console.warn(`Notification insert failed for user ${user.id}: ${error.message}`);
      }
    }
  }

  return sentCount;
}

router.post('/seed-catalog', async (req, res, next) => {
  try {
    await ensureRingTables();

    const requestBody = req.body || {};
    const requestedModelName = String(requestBody.modelName || '').trim();
    if (!requestedModelName) {
      return res.status(400).json({ message: 'Insert product data from Admin Seed. Default catalog seeding is disabled.' });
    }

    const catalogItems = [
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
    ];

    if (!catalogItems[0].material || !Number.isFinite(catalogItems[0].basePrice) || catalogItems[0].basePrice <= 0) {
      return res.status(400).json({ message: 'modelName, material, and a valid basePrice are required.' });
    }

    let createdModels = 0;
    let createdRings = 0;
    let syncedInventoryItems = 0;
    let createdNotifications = 0;

    for (const item of catalogItems) {
      const existingModels = await query('SELECT id FROM ring_models WHERE model_name = ? LIMIT 1', [item.modelName]);
      const modelId = await findOrCreateModel(item);
      if (!existingModels.length) {
        createdModels += 1;
      }
      const createdRingsForItem = await createRingsForModel(modelId, item);
      createdRings += createdRingsForItem;
      syncedInventoryItems += await syncInventoryForModel(modelId);

      if (createdRingsForItem > 0 || !existingModels.length) {
        createdNotifications += await notifyUsersAboutCatalogItem(item, createdRingsForItem);
      }
    }

    return res.json({
      message: 'Catalog item inserted successfully.',
      createdModels,
      createdRings,
      syncedInventoryItems,
      createdNotifications,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
