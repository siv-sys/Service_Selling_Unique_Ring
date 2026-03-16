const fs = require('node:fs/promises');
const path = require('node:path');
const { query, execute } = require('../config/db.js');

const SEED_HISTORY_FILE = path.resolve(__dirname, '../../data/seed-catalog-history.json');

const MIGRATIONS = [
  {
    id: '001_create_shop_tables',
    kind: 'schema',
    statements: [
      `
      CREATE TABLE IF NOT EXISTS ring_models (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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
      `,
      `
      CREATE TABLE IF NOT EXISTS rings (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        ring_identifier VARCHAR(60) NOT NULL UNIQUE,
        ring_name VARCHAR(120) NOT NULL,
        model_id BIGINT UNSIGNED NULL,
        size VARCHAR(20) NULL,
        material VARCHAR(80) NOT NULL,
        status ENUM('AVAILABLE', 'RESERVED', 'ASSIGNED', 'LOST', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
        location_type ENUM('WAREHOUSE', 'USER', 'TRANSIT', 'SERVICE') NOT NULL DEFAULT 'WAREHOUSE',
        location_label VARCHAR(120) NULL,
        price DECIMAL(12,2) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_rings_model FOREIGN KEY (model_id) REFERENCES ring_models(id)
      ) ENGINE=InnoDB
      `,
    ],
  },
  {
    id: '002_seed_shop_catalog',
    kind: 'seed',
    statements: [
      `
      INSERT INTO ring_models (model_name, collection_name, material, description, image_url, base_price, currency_code)
      SELECT
        'Eternal Bond Gold',
        'Classic Series',
        '18K Gold',
        'Premium gold couple ring set with engraved inner band.',
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&h=800&fit=crop',
        1200.00,
        'USD'
      WHERE NOT EXISTS (
        SELECT 1
        FROM ring_models
        WHERE model_name = 'Eternal Bond Gold'
      )
      `,
      `
      INSERT INTO ring_models (model_name, collection_name, material, description, image_url, base_price, currency_code)
      SELECT
        'Infinity Whisper',
        'Moonlight',
        'Platinum',
        'Minimal platinum ring with hidden inscription.',
        'https://images.unsplash.com/photo-1598560917505-59a3ad559071?q=80&w=600&h=800&fit=crop',
        1400.00,
        'USD'
      WHERE NOT EXISTS (
        SELECT 1
        FROM ring_models
        WHERE model_name = 'Infinity Whisper'
      )
      `,
      `
      INSERT INTO rings (ring_identifier, ring_name, model_id, size, material, status, location_type, location_label, price)
      SELECT 'SHOP-EBG-001', 'Eternal Bond Gold 1', m.id, '7', m.material, 'AVAILABLE', 'WAREHOUSE', 'Main WH', m.base_price
      FROM ring_models m
      WHERE m.model_name = 'Eternal Bond Gold'
      ORDER BY m.id ASC
      LIMIT 1
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        location_label = VALUES(location_label),
        price = VALUES(price)
      `,
      `
      INSERT INTO rings (ring_identifier, ring_name, model_id, size, material, status, location_type, location_label, price)
      SELECT 'SHOP-EBG-002', 'Eternal Bond Gold 2', m.id, '8', m.material, 'AVAILABLE', 'WAREHOUSE', 'Main WH', m.base_price
      FROM ring_models m
      WHERE m.model_name = 'Eternal Bond Gold'
      ORDER BY m.id ASC
      LIMIT 1
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        location_label = VALUES(location_label),
        price = VALUES(price)
      `,
    ],
  },
];

async function appendSeedHistory(entry) {
  await fs.mkdir(path.dirname(SEED_HISTORY_FILE), { recursive: true });

  let history = [];
  try {
    const fileContent = await fs.readFile(SEED_HISTORY_FILE, 'utf8');
    const parsed = JSON.parse(fileContent);
    if (Array.isArray(parsed)) {
      history = parsed;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  history.push({
    ...entry,
    storedAt: new Date().toISOString(),
  });

  await fs.writeFile(SEED_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
}

async function ensureMigrationTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      id VARCHAR(120) PRIMARY KEY,
      kind ENUM('schema', 'seed') NOT NULL DEFAULT 'schema',
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
}

async function getAppliedMigrationIds() {
  await ensureMigrationTable();
  const rows = await query('SELECT id FROM app_migrations');
  return new Set(rows.map((row) => row.id));
}

async function applyMigration(migration) {
  for (const statement of migration.statements) {
    await execute(statement);
  }

  await execute(
    `
    INSERT INTO app_migrations (id, kind)
    VALUES (:id, :kind)
    ON DUPLICATE KEY UPDATE kind = VALUES(kind), applied_at = CURRENT_TIMESTAMP
    `,
    { id: migration.id, kind: migration.kind },
  );
}

async function getMigrationStatus() {
  const appliedIds = await getAppliedMigrationIds();

  const appliedMigrations = MIGRATIONS.filter((migration) => appliedIds.has(migration.id)).map((migration) => migration.id);
  const pendingMigrations = MIGRATIONS.filter((migration) => !appliedIds.has(migration.id)).map((migration) => migration.id);

  return {
    appliedCount: appliedMigrations.length,
    pendingCount: pendingMigrations.length,
    appliedMigrations,
    pendingMigrations,
  };
}

async function runPendingMigrations() {
  const appliedIds = await getAppliedMigrationIds();
  const pending = MIGRATIONS.filter((migration) => !appliedIds.has(migration.id));

  for (const migration of pending) {
    await applyMigration(migration);
  }

  return {
    appliedCount: pending.length,
    appliedMigrations: pending.map((migration) => migration.id),
  };
}

async function runPendingSchemaMigrations() {
  const appliedIds = await getAppliedMigrationIds();
  const pending = MIGRATIONS.filter((migration) => migration.kind === 'schema' && !appliedIds.has(migration.id));

  for (const migration of pending) {
    await applyMigration(migration);
  }

  return {
    appliedCount: pending.length,
    appliedMigrations: pending.map((migration) => migration.id),
  };
}

async function runSeedCatalogMigration() {
  const migration = MIGRATIONS.find((item) => item.id === '002_seed_shop_catalog');
  if (!migration) {
    throw new Error('Seed migration definition not found');
  }

  await applyMigration(migration);

  const modelCountRows = await query(
    `
    SELECT COUNT(*) AS count
    FROM ring_models
    WHERE model_name IN ('Eternal Bond Gold', 'Infinity Whisper')
    `,
  );
  const ringCountRows = await query(
    `
    SELECT COUNT(*) AS count
    FROM rings
    WHERE ring_identifier IN ('SHOP-EBG-001', 'SHOP-EBG-002')
    `,
  );

  const result = {
    message: 'Seed migration executed successfully.',
    createdModels: Number(modelCountRows[0]?.count || 0),
    createdRings: Number(ringCountRows[0]?.count || 0),
    storedFile: SEED_HISTORY_FILE,
  };

  await appendSeedHistory({
    type: 'default-seed',
    models: ['Eternal Bond Gold', 'Infinity Whisper'],
    rings: ['SHOP-EBG-001', 'SHOP-EBG-002'],
    result,
  });

  return result;
}

async function runCustomCatalogSeedMigration(payload) {
  const price = Number(payload.basePrice);
  const stockCount = Number(payload.stockCount);
  const startingNumber = Number(payload.startingNumber);

  if (!payload.modelName || !payload.material || !Number.isFinite(price)) {
    throw new Error('Model name, material, and valid base price are required.');
  }
  if (!Number.isInteger(stockCount) || stockCount < 1) {
    throw new Error('Stock count must be a positive integer.');
  }

  const modelName = String(payload.modelName).trim();
  const collectionName = payload.collectionName ? String(payload.collectionName).trim() : null;
  const material = String(payload.material).trim();
  const description = payload.description ? String(payload.description).trim() : null;
  const imageUrl = payload.imageUrl ? String(payload.imageUrl).trim() : null;
  const currencyCode = payload.currencyCode ? String(payload.currencyCode).trim().toUpperCase() : 'USD';
  const ringNamePrefix = payload.ringNamePrefix ? String(payload.ringNamePrefix).trim() : modelName;
  const ringIdentifierPrefix = payload.ringIdentifierPrefix ? String(payload.ringIdentifierPrefix).trim() : 'SHOP-CUSTOM';
  const defaultSize = payload.defaultSize ? String(payload.defaultSize).trim() : null;
  const locationLabel = payload.locationLabel ? String(payload.locationLabel).trim() : null;
  const color = payload.color ? String(payload.color).trim() : material;
  const supplier = payload.supplier ? String(payload.supplier).trim() : null;

  const modelInsertResult = await execute(
    `
    INSERT INTO ring_models (model_name, collection_name, material, description, image_url, base_price, currency_code, supplier_name)
    VALUES (:modelName, :collectionName, :material, :description, :imageUrl, :basePrice, :currencyCode, :supplier)
    `,
    {
      modelName,
      collectionName,
      material,
      description,
      imageUrl,
      basePrice: price,
      currencyCode,
      supplier,
    },
  );

  const modelId = Number(modelInsertResult.insertId);
  const ringIdentifiers = [];

  // Determine status and color based on stock
  let status = 'In Stock';
  let statusColor = 'emerald';
  if (stockCount === 0) {
    status = 'Depleted';
    statusColor = 'rose';
  } else if (stockCount <= 20) {
    status = 'Low Stock';
    statusColor = 'amber';
  }

  // Insert into inventory_items for Ring Inventory page
  const inventorySku = `${ringIdentifierPrefix}`;
  const inventorySerial = `MODEL-${modelId}-${Date.now()}`;
  const stockPercent = Math.min(100, Math.round((stockCount / 100) * 100));

  await execute(
    `
    INSERT INTO inventory_items 
    (image_url, model_name, color, variant, sku, serial_number, status, stock_qty, stock_percent, status_color, supplier)
    VALUES (:imageUrl, :modelName, :color, :variant, :sku, :serial, :status, :stockQty, :stockPercent, :statusColor, :supplier)
    ON DUPLICATE KEY UPDATE
      image_url = VALUES(image_url),
      color = VALUES(color),
      variant = VALUES(variant),
      status = VALUES(status),
      stock_qty = VALUES(stock_qty),
      stock_percent = VALUES(stock_percent),
      status_color = VALUES(status_color),
      supplier = VALUES(supplier)
    `,
    {
      imageUrl,
      modelName,
      color,
      variant: `${defaultSize || 'Standard'} - ${material}`,
      sku: inventorySku,
      serial: inventorySerial,
      status,
      stockQty: stockCount,
      stockPercent: stockPercent,
      statusColor,
      supplier,
    },
  );

  for (let i = 0; i < stockCount; i += 1) {
    const sequence = String(startingNumber + i).padStart(3, '0');
    const ringIdentifier = `${ringIdentifierPrefix}-${sequence}`;
    ringIdentifiers.push(ringIdentifier);
    await execute(
      `
      INSERT INTO rings (ring_identifier, ring_name, model_id, size, material, status, location_type, location_label, price, supplier_name)
      VALUES (:ringIdentifier, :ringName, :modelId, :size, :material, 'AVAILABLE', 'WAREHOUSE', :locationLabel, :price, :supplier)
      ON DUPLICATE KEY UPDATE
        ring_name = VALUES(ring_name),
        model_id = VALUES(model_id),
        size = VALUES(size),
        material = VALUES(material),
        status = VALUES(status),
        location_type = VALUES(location_type),
        location_label = VALUES(location_label),
        price = VALUES(price),
        supplier_name = VALUES(supplier_name)
      `,
      {
        ringIdentifier,
        ringName: `${ringNamePrefix} ${i + 1}`,
        modelId,
        size: defaultSize,
        material,
        locationLabel,
        price,
        supplier,
      },
    );
  }

  const migrationId = `custom_seed_${Date.now()}`;
  await execute('INSERT INTO app_migrations (id, kind) VALUES (:id, :kind)', {
    id: migrationId,
    kind: 'seed',
  });

  const result = {
    message: `Inserted model #${modelId}, ${stockCount} ring(s), and added to inventory.`,
    createdModels: 1,
    createdRings: stockCount,
    inventoryAdded: true,
    migrationId,
    storedFile: SEED_HISTORY_FILE,
  };

  await appendSeedHistory({
    type: 'custom-seed',
    migrationId,
    model: {
      id: modelId,
      modelName,
      collectionName,
      material,
      description,
      imageUrl,
      basePrice: price,
      currencyCode,
      supplier,
    },
    ringConfig: {
      ringNamePrefix,
      ringIdentifierPrefix,
      ringIdentifiers,
      stockCount,
      startingNumber,
      defaultSize,
      locationLabel,
      supplier,
    },
    result,
  });

  return result;
}

module.exports = {
  MIGRATIONS,
  getMigrationStatus,
  runPendingMigrations,
  runPendingSchemaMigrations,
  runSeedCatalogMigration,
  runCustomCatalogSeedMigration,
};
