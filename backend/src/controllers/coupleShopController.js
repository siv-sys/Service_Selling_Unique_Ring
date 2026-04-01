const { pool } = require('../config/db');

function mapMaterialToType(material) {
  const value = String(material || '').toLowerCase();

  if (value.includes('platinum')) return 'platinum';
  if (value.includes('gold')) return 'gold';
  if (value.includes('diamond') || value.includes('white')) return 'diamond';
  if (value.includes('silver')) return 'silver';

  return 'other';
}

function deriveStatus(availableUnits) {
  if (availableUnits <= 0) {
    return { status: 'UNAVAILABLE', statusColor: 'rose' };
  }

  if (availableUnits <= 5) {
    return { status: 'LOW_STOCK', statusColor: 'amber' };
  }

  return { status: 'AVAILABLE', statusColor: 'emerald' };
}

function toShopItemResponse(row) {
  const availableUnits = Number(row.available_units || 0);
  const derivedStatus = deriveStatus(availableUnits);
  const image = row.image_url || null;
  const basePrice = Number(row.base_price || 0);
  const createdAt = row.created_at || null;
  const updatedAt = row.updated_at || null;
  const size = String(row.sample_size || row.size || '20').trim() || '20';
  const material = String(row.material || row.sample_material || '').trim();
  const sku = `SKU-${String(row.model_name || `MODEL-${row.id}`).toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${size}`;
  const serialNumber = `INV-${row.id}-${String(material || 'MATERIAL').toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${size}`;

  return {
    id: Number(row.id),
    model_id: Number(row.id),
    model: row.model_name || '',
    model_name: row.model_name || '',
    ring_name: row.model_name || '',
    name: row.model_name || '',
    ring_identifier: `MODEL-${row.id}`,
    identifier: `MODEL-${row.id}`,
    sku,
    serial: '',
    serial_number: serialNumber,
    image,
    image_url: image,
    img: image,
    material,
    color: material,
    metal: material,
    variant: row.collection_name ? `Collection ${row.collection_name}` : material || '',
    size,
    description: row.description || null,
    status: derivedStatus.status,
    stock: availableUnits,
    stockPercent: availableUnits > 0 ? Math.min(100, availableUnits * 10) : 0,
    statusColor: derivedStatus.statusColor,
    price: basePrice,
    base_price: basePrice,
    currency_code: row.currency_code || 'USD',
    collection_name: row.collection_name || null,
    collection: row.collection_name || 'Signature',
    available_units: availableUnits,
    representative_ring_id: row.representative_ring_id || null,
    sample_size: size,
    createdAt,
    updatedAt,
    created_at: createdAt,
    updated_at: updatedAt,
    cert: row.description || row.collection_name || row.material || 'AVAILABLE',
    type: mapMaterialToType(material),
    isNew: createdAt ? (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 30 : false,
  };
}

async function getShopRings(req, res) {
  try {
    const {
      material,
      minPrice,
      maxPrice,
      search,
      collection,
      limit = 50,
      offset = 0,
    } = req.query;

    const filters = ['1=1'];
    const params = [];

    if (material) {
      filters.push('rm.material LIKE ?');
      params.push(`%${String(material).trim()}%`);
    }

    if (collection) {
      filters.push('rm.collection_name LIKE ?');
      params.push(`%${String(collection).trim()}%`);
    }

    if (minPrice) {
      filters.push('rm.base_price >= ?');
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      filters.push('rm.base_price <= ?');
      params.push(Number(maxPrice));
    }

    if (search) {
      filters.push(
        '(rm.model_name LIKE ? OR rm.collection_name LIKE ? OR rm.material LIKE ? OR rm.description LIKE ?)'
      );
      const term = `%${String(search).trim()}%`;
      params.push(term, term, term, term);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const [rows] = await pool.execute(
      `
        SELECT
          rm.id,
          rm.model_name,
          rm.collection_name,
          rm.material,
          rm.description,
          rm.image_url,
          rm.base_price,
          rm.currency_code,
          rm.created_at,
          rm.updated_at,
          COALESCE(stock.available_units, 0) AS available_units,
          stock.available_ring_id AS representative_ring_id,
          stock.sample_size,
          stock.sample_material
        FROM ring_models rm
        LEFT JOIN (
          SELECT
            model_id,
            COUNT(*) AS total_units,
            SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_units,
            MIN(CASE WHEN status = 'AVAILABLE' THEN id END) AS available_ring_id,
            MIN(id) AS any_ring_id,
            MIN(NULLIF(size, '')) AS sample_size,
            MIN(NULLIF(material, '')) AS sample_material
          FROM rings
          GROUP BY model_id
        ) stock ON stock.model_id = rm.id
        ${whereClause}
        ORDER BY rm.updated_at DESC, rm.id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );

    const [countRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM ring_models rm
        LEFT JOIN (
          SELECT DISTINCT model_id
          FROM rings
        ) stock ON stock.model_id = rm.id
        ${whereClause}
      `,
      params
    );

    const items = rows.map(toShopItemResponse);

    res.json({
      success: true,
      data: items,
      items,
      pagination: {
        total: Number(countRows[0]?.total || 0),
        limit: Number(limit),
        offset: Number(offset),
        returned: items.length,
      },
    });
  } catch (error) {
    console.error('Error fetching couple shop rings:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message,
    });
  }
}

async function getFilterOptions(req, res) {
  try {
    const [materials] = await pool.execute(`
      SELECT DISTINCT material
      FROM ring_models
      WHERE material IS NOT NULL
        AND material != ''
      ORDER BY material
    `);

    const [priceRange] = await pool.execute(`
      SELECT MIN(base_price) AS min_price, MAX(base_price) AS max_price
      FROM ring_models
    `);

    const [collections] = await pool.execute(`
      SELECT DISTINCT collection_name
      FROM ring_models
      WHERE collection_name IS NOT NULL
        AND collection_name != ''
      ORDER BY collection_name
    `);

    res.json({
      success: true,
      data: {
        materials: materials.map((row) => row.material).filter(Boolean),
        collections: collections.map((row) => row.collection_name).filter(Boolean),
        priceRange: {
          min_price: Number(priceRange[0]?.min_price || 0),
          max_price: Number(priceRange[0]?.max_price || 0),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching couple shop filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message,
    });
  }
}

async function getShopRingById(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `
        SELECT
          rm.id,
          rm.model_name,
          rm.collection_name,
          rm.material,
          rm.description,
          rm.image_url,
          rm.base_price,
          rm.currency_code,
          rm.created_at,
          rm.updated_at,
          COALESCE(stock.available_units, 0) AS available_units,
          stock.available_ring_id AS representative_ring_id,
          stock.sample_size,
          stock.sample_material
        FROM ring_models rm
        LEFT JOIN (
          SELECT
            model_id,
            SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_units,
            MIN(CASE WHEN status = 'AVAILABLE' THEN id END) AS available_ring_id,
            MIN(id) AS any_ring_id,
            MIN(NULLIF(size, '')) AS sample_size,
            MIN(NULLIF(material, '')) AS sample_material
          FROM rings
          GROUP BY model_id
        ) stock ON stock.model_id = rm.id
        WHERE rm.id = ?
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Ring not found',
      });
    }

    res.json({
      success: true,
      data: toShopItemResponse(rows[0]),
    });
  } catch (error) {
    console.error('Error fetching couple shop ring:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message,
    });
  }
}

module.exports = {
  getShopRings,
  getFilterOptions,
  getShopRingById,
};
