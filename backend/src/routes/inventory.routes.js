const express = require('express');
const { query } = require('../config/db');

const router = express.Router();

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

router.get('/filters', async (_req, res, next) => {
  try {
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
  try {
    const result = await query('DELETE FROM inventory_items WHERE id = :id', { id: req.params.id });
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
