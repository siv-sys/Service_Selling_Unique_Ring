const express = require('express');
const { pool, query } = require('../config/db');

const router = express.Router();

function deriveInventoryColor(material) {
  const normalized = String(material || '').toLowerCase();

  if (normalized.includes('rose')) return 'Rose Gold';
  if (normalized.includes('silver')) return 'Silver';
  if (normalized.includes('platinum')) return 'Platinum';
  if (normalized.includes('gold')) return 'Gold';
  return String(material || '').trim() || null;
}

function deriveInventoryState(stockValue) {
  const stockQty = Math.max(0, Number(stockValue || 0));

  if (stockQty === 0) {
    return { stockQty: 0, stockPercent: 0, status: 'Depleted', statusColor: 'rose' };
  }
  if (stockQty <= 5) {
    return { stockQty, stockPercent: Math.min(100, stockQty * 20), status: 'Low Stock', statusColor: 'amber' };
  }
  return { stockQty, stockPercent: 100, status: 'In Stock', statusColor: 'emerald' };
}

function toInventoryKeyPart(value, fallback) {
  const normalized = String(value || fallback || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  return normalized || String(fallback || 'ITEM').toUpperCase();
}

function buildFilters(input) {
  const where = [];
  const params = {};

  if (input.search) {
    where.push(
      '(model_name LIKE :search OR variant LIKE :search OR sku LIKE :search OR serial_number LIKE :search)'
    );
    params.search = `%${input.search}%`;
  }

  if (input.model && input.model !== 'All Models') {
    where.push('model_name = :model');
    params.model = input.model;
  }

  if (input.color && input.color !== 'All Colors') {
    where.push('color = :color');
    params.color = input.color;
  }

  if (input.status && input.status !== 'Any Status') {
    where.push('status = :status');
    params.status = input.status;
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

function toItemResponse(row) {
  const stock = Number(row.stock_qty);
  return {
    id: row.id,
    image: row.image_url,
    model: row.model_name,
    color: row.color,
    variant: row.variant,
    sku: row.sku,
    serial: row.serial_number,
    status: row.status,
    stock,
    stockPercent: Math.max(0, Math.min(100, Number(row.stock_percent))),
    statusColor: row.status_color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseInventoryVariant(variant) {
  const match = /^Size (.+?) - (.+)$/.exec(String(variant || '').trim());
  if (!match) {
    return { size: null, material: null };
  }

  return {
    size: match[1] || null,
    material: match[2] || null,
  };
}

function parseModelIdFromSerial(serialNumber) {
  const match = /^INV-(\d+)-/.exec(String(serialNumber || ''));
  return match ? Number(match[1]) : null;
}

async function syncInventoryForModel(connection, modelId) {
  const [rings] = await connection.execute(
    `
      SELECT
        r.id,
        r.ring_identifier,
        r.ring_name,
        r.size,
        r.material,
        r.status,
        r.image_url,
        rm.model_name,
        rm.image_url AS model_image_url
      FROM rings r
      LEFT JOIN ring_models rm ON rm.id = r.model_id
      WHERE r.model_id = ?
      ORDER BY r.id ASC
    `,
    [modelId]
  );

  if (!rings.length) {
    await connection.execute(
      'DELETE FROM inventory_items WHERE serial_number LIKE ?',
      [`INV-${modelId}-%`]
    );
    return;
  }

  const groupedVariants = new Map();

  for (const ring of rings) {
    const modelName = ring.model_name || ring.ring_name;
    const size = ring.size || 'N/A';
    const material = ring.material || 'Unknown';
    const imageUrl = ring.image_url || ring.model_image_url || null;
    const groupKey = `${modelName}::${size}::${material}`;
    const existingGroup = groupedVariants.get(groupKey) || {
      modelName,
      size,
      material,
      imageUrl,
      availableQty: 0,
    };

    if (String(ring.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE') {
      existingGroup.availableQty += 1;
    }
    if (!existingGroup.imageUrl && imageUrl) {
      existingGroup.imageUrl = imageUrl;
    }

    groupedVariants.set(groupKey, existingGroup);
  }

  const validSerials = [];

  for (const group of groupedVariants.values()) {
    const variant = `Size ${group.size} - ${group.material}`;
    const inventoryState = deriveInventoryState(group.availableQty);
    const sku = `SKU-${toInventoryKeyPart(group.modelName, 'MODEL')}-${toInventoryKeyPart(group.size, 'SIZE')}`;
    const serialNumber = `INV-${modelId}-${toInventoryKeyPart(group.material, 'MAT')}-${toInventoryKeyPart(group.size, 'SIZE')}`;
    validSerials.push(serialNumber);

    const [existingInventory] = await connection.execute(
      `
        SELECT id
        FROM inventory_items
        WHERE sku = ?
           OR serial_number = ?
        LIMIT 1
      `,
      [sku, serialNumber]
    );

    if (existingInventory.length) {
      await connection.execute(
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
        ]
      );
    } else {
      await connection.execute(
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
        ]
      );
    }
  }

  if (validSerials.length) {
    const placeholders = validSerials.map(() => '?').join(', ');
    await connection.execute(
      `DELETE FROM inventory_items WHERE serial_number LIKE ? AND serial_number NOT IN (${placeholders})`,
      [`INV-${modelId}-%`, ...validSerials]
    );
  }
}

async function syncInventoryFromRingModels() {
  const connection = await pool.getConnection();

  try {
    const [modelRows] = await connection.execute('SELECT id FROM ring_models ORDER BY id ASC');
    const modelIds = modelRows.map((row) => Number(row.id)).filter(Boolean);

    for (const modelId of modelIds) {
      await syncInventoryForModel(connection, modelId);
    }

    const [inventoryRows] = await connection.execute(
      'SELECT id, serial_number FROM inventory_items WHERE serial_number LIKE ?',
      ['INV-%']
    );

    for (const inventoryRow of inventoryRows) {
      const modelId = parseModelIdFromSerial(inventoryRow.serial_number);
      if (!modelId || !modelIds.includes(modelId)) {
        await connection.execute('DELETE FROM inventory_items WHERE id = ?', [inventoryRow.id]);
      }
    }
  } finally {
    connection.release();
  }
}

router.get('/filters', async (_req, res, next) => {
  try {
    await syncInventoryFromRingModels();

    const models = await query('SELECT DISTINCT model_name AS value FROM inventory_items ORDER BY model_name');
    const colors = await query('SELECT DISTINCT color AS value FROM inventory_items ORDER BY color');
    const statuses = await query('SELECT DISTINCT status AS value FROM inventory_items ORDER BY status');

    res.json({
      models: ['All Models', ...models.map((row) => row.value)],
      colors: ['All Colors', ...colors.map((row) => row.value)],
      statuses: ['Any Status', ...statuses.map((row) => row.value)],
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    await syncInventoryFromRingModels();

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
    const offset = (page - 1) * limit;

    const { whereSql, params } = buildFilters({
      search: req.query.search,
      model: req.query.model,
      color: req.query.color,
      status: req.query.status,
    });

    const countRows = await query(
      `SELECT COUNT(*) AS total
       FROM inventory_items
       ${whereSql}`,
      params
    );

    const rows = await query(
      `SELECT *
       FROM inventory_items
       ${whereSql}
       ORDER BY updated_at DESC, id DESC
       LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset }
    );

    res.json({
      items: rows.map(toItemResponse),
      pagination: {
        page,
        limit,
        total: Number(countRows[0].total),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    await syncInventoryFromRingModels();

    const rows = await query('SELECT * FROM inventory_items WHERE id = :id LIMIT 1', { id: req.params.id });
    if (!rows.length) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json(toItemResponse(rows[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      image,
      model,
      color,
      variant,
      sku,
      serial,
      status,
      stock,
      stockPercent,
      statusColor,
    } = req.body;

    if (!model || !variant || !sku || !serial || !status) {
      return res.status(400).json({ message: 'model, variant, sku, serial, and status are required' });
    }

    const safeStock = Math.max(0, Number(stock || 0));
    const safeStockPercent = Math.max(0, Math.min(100, Number(stockPercent || 0)));

    const result = await query(
      `INSERT INTO inventory_items
      (image_url, model_name, color, variant, sku, serial_number, status, stock_qty, stock_percent, status_color)
      VALUES (:image, :model, :color, :variant, :sku, :serial, :status, :stock, :stockPercent, :statusColor)`,
      {
        image: image || null,
        model,
        color: color || null,
        variant,
        sku,
        serial,
        status,
        stock: safeStock,
        stockPercent: safeStockPercent,
        statusColor: statusColor || null,
      }
    );

    const rows = await query('SELECT * FROM inventory_items WHERE id = :id LIMIT 1', { id: result.insertId });
    res.status(201).json(toItemResponse(rows[0]));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'SKU or serial already exists' });
    }
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const {
      image,
      model,
      color,
      variant,
      sku,
      serial,
      status,
      stock,
      stockPercent,
      statusColor,
    } = req.body;

    if (!model || !variant || !sku || !serial || !status) {
      return res.status(400).json({ message: 'model, variant, sku, serial, and status are required' });
    }

    const safeStock = Math.max(0, Number(stock || 0));
    const safeStockPercent = Math.max(0, Math.min(100, Number(stockPercent || 0)));

    const result = await query(
      `UPDATE inventory_items
       SET image_url = :image,
           model_name = :model,
           color = :color,
           variant = :variant,
           sku = :sku,
           serial_number = :serial,
           status = :status,
           stock_qty = :stock,
           stock_percent = :stockPercent,
           status_color = :statusColor
       WHERE id = :id`,
      {
        id: req.params.id,
        image: image || null,
        model,
        color: color || null,
        variant,
        sku,
        serial,
        status,
        stock: safeStock,
        stockPercent: safeStockPercent,
        statusColor: statusColor || null,
      }
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const rows = await query('SELECT * FROM inventory_items WHERE id = :id LIMIT 1', { id: req.params.id });
    res.json(toItemResponse(rows[0]));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'SKU or serial already exists' });
    }
    next(error);
  }
});

router.patch('/:id/stock', async (req, res, next) => {
  try {
    const stock = Math.max(0, Number(req.body.stock));
    if (!Number.isFinite(stock)) {
      return res.status(400).json({ message: 'stock must be a valid number' });
    }

    const result = await query(
      `UPDATE inventory_items
       SET stock_qty = :stock
       WHERE id = :id`,
      { stock, id: req.params.id }
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const rows = await query('SELECT * FROM inventory_items WHERE id = :id LIMIT 1', { id: req.params.id });
    res.json(toItemResponse(rows[0]));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [inventoryRows] = await connection.execute(
      'SELECT id, model_name, variant, serial_number FROM inventory_items WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    if (!inventoryRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const inventoryItem = inventoryRows[0];
    const deleteInventoryResult = await connection.execute('DELETE FROM inventory_items WHERE id = ?', [req.params.id]);
    const inventoryAffectedRows = deleteInventoryResult[0]?.affectedRows || 0;

    let deletedRingRows = 0;
    let deletedModelRows = 0;

    const modelIdMatch = /^INV-(\d+)-/.exec(String(inventoryItem.serial_number || ''));
    const parsedModelId = modelIdMatch ? Number(modelIdMatch[1]) : null;
    const { size, material } = parseInventoryVariant(inventoryItem.variant);

    if (parsedModelId) {
      const ringConditions = ['model_id = ?'];
      const ringParams = [parsedModelId];

      if (size) {
        ringConditions.push('COALESCE(size, \'\') = ?');
        ringParams.push(size);
      }

      if (material) {
        ringConditions.push('material = ?');
        ringParams.push(material);
      }

      const [ringRows] = await connection.execute(
        `SELECT id FROM rings WHERE ${ringConditions.join(' AND ')}`,
        ringParams
      );

      if (ringRows.length) {
        const ringIds = ringRows.map((row) => row.id);
        const placeholders = ringIds.map(() => '?').join(', ');

        await connection.execute(
          `DELETE FROM ring_pair_links WHERE ring_id IN (${placeholders})`,
          ringIds
        ).catch(() => {});

        const [deleteRingsResult] = await connection.execute(
          `DELETE FROM rings WHERE id IN (${placeholders})`,
          ringIds
        );
        deletedRingRows = deleteRingsResult?.affectedRows || 0;
      }

      const [remainingRings] = await connection.execute(
        'SELECT COUNT(*) AS total FROM rings WHERE model_id = ?',
        [parsedModelId]
      );

      if (Number(remainingRings[0]?.total || 0) === 0) {
        const [deleteModelResult] = await connection.execute(
          'DELETE FROM ring_models WHERE id = ?',
          [parsedModelId]
        );
        deletedModelRows = deleteModelResult?.affectedRows || 0;
      }
    }

    await connection.commit();

    res.status(200).json({
      message: 'Inventory item deleted successfully.',
      deletedInventoryRows: inventoryAffectedRows,
      deletedRingRows,
      deletedModelRows,
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;
