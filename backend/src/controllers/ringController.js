const { pool } = require('../config/db');
const coupleShopController = require('./coupleShopController');

function mapModelRowToShopItem(row) {
  return {
    id: row.id,
    ring_identifier: row.ring_identifier || `MODEL-${row.id}`,
    ring_name: row.ring_name || row.model_name,
    model_id: row.model_id ?? row.id,
    batch_id: row.batch_id || null,
    size: row.size || '',
    material: row.material || '',
    status: row.status || 'AVAILABLE',
    location_type: row.location_type || 'WAREHOUSE',
    location_label: row.location_label || null,
    battery_level: row.battery_level || null,
    last_seen_at: row.last_seen_at || null,
    last_seen_lat: row.last_seen_lat || null,
    last_seen_lng: row.last_seen_lng || null,
    price: row.price || 0,
    image_url: row.image_url || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    model_name: row.model_name || row.ring_name || '',
    collection_name: row.collection_name || null,
    available_units: Number(row.available_units || 0),
    representative_ring_id: row.representative_ring_id ? Number(row.representative_ring_id) : null,
  };
}

// Get all rings (for admin)
const getAllRings = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        r.*,
        rm.model_name,
        rm.collection_name
      FROM rings r
      LEFT JOIN ring_models rm ON rm.id = r.model_id
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching all rings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
};

// Get rings for shop (with filters)
const getShopRings = async (req, res) => coupleShopController.getShopRings(req, res);

// Get filter options
const getFilterOptions = async (req, res) => coupleShopController.getFilterOptions(req, res);

// Get ring by identifier
const getRingByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const [rows] = await pool.execute(
      `
        SELECT
          r.*,
          rm.model_name,
          rm.collection_name
        FROM rings r
        LEFT JOIN ring_models rm ON rm.id = r.model_id
        WHERE r.ring_identifier = ?
      `,
      [identifier]
    );
    
    if (rows.length === 0) {
      const [modelRows] = await pool.execute(
        `
          SELECT
            rm.id AS id,
            CONCAT('MODEL-', rm.id) AS ring_identifier,
            rm.model_name AS ring_name,
            rm.id AS model_id,
            NULL AS batch_id,
            COALESCE(stock.sample_size, '') AS size,
            rm.material,
            CASE WHEN COALESCE(stock.available_units, 0) > 0 THEN 'AVAILABLE' ELSE 'UNAVAILABLE' END AS status,
            'WAREHOUSE' AS location_type,
            NULL AS location_label,
            NULL AS battery_level,
            NULL AS last_seen_at,
            NULL AS last_seen_lat,
            NULL AS last_seen_lng,
            rm.base_price AS price,
            NULLIF(rm.image_url, '') AS image_url,
            rm.created_at,
            rm.updated_at,
            rm.model_name,
            rm.collection_name,
            COALESCE(stock.available_units, 0) AS available_units,
            stock.representative_ring_id
          FROM ring_models rm
          LEFT JOIN (
            SELECT
              model_id,
              COUNT(*) AS available_units,
              MIN(id) AS representative_ring_id,
              MIN(COALESCE(NULLIF(size, ''), '')) AS sample_size
            FROM rings
            WHERE status = 'AVAILABLE'
            GROUP BY model_id
          ) stock ON stock.model_id = rm.id
          WHERE CONCAT('MODEL-', rm.id) = ?
        `,
        [identifier]
      );

      if (modelRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Ring not found' 
        });
      }

      return res.json({ success: true, data: mapModelRowToShopItem(modelRows[0]) });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching ring by identifier:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
};

// Get ring by ID
const getRingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(
      `
        SELECT
          r.*,
          rm.model_name,
          rm.collection_name
        FROM rings r
        LEFT JOIN ring_models rm ON rm.id = r.model_id
        WHERE r.id = ? OR r.ring_identifier = ?
      `,
      [id, id]
    );
    
    if (rows.length === 0) {
      const [modelRows] = await pool.execute(
        `
          SELECT
            rm.id AS id,
            CONCAT('MODEL-', rm.id) AS ring_identifier,
            rm.model_name AS ring_name,
            rm.id AS model_id,
            NULL AS batch_id,
            COALESCE(stock.sample_size, '') AS size,
            rm.material,
            CASE WHEN COALESCE(stock.available_units, 0) > 0 THEN 'AVAILABLE' ELSE 'UNAVAILABLE' END AS status,
            'WAREHOUSE' AS location_type,
            NULL AS location_label,
            NULL AS battery_level,
            NULL AS last_seen_at,
            NULL AS last_seen_lat,
            NULL AS last_seen_lng,
            rm.base_price AS price,
            NULLIF(rm.image_url, '') AS image_url,
            rm.created_at,
            rm.updated_at,
            rm.model_name,
            rm.collection_name,
            COALESCE(stock.available_units, 0) AS available_units,
            stock.representative_ring_id
          FROM ring_models rm
          LEFT JOIN (
            SELECT
              model_id,
              COUNT(*) AS available_units,
              MIN(id) AS representative_ring_id,
              MIN(COALESCE(NULLIF(size, ''), '')) AS sample_size
            FROM rings
            WHERE status = 'AVAILABLE'
            GROUP BY model_id
          ) stock ON stock.model_id = rm.id
          WHERE rm.id = ?
             OR CONCAT('MODEL-', rm.id) = ?
        `,
        [id, id]
      );

      if (modelRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Ring not found' 
        });
      }

      return res.json({ success: true, data: mapModelRowToShopItem(modelRows[0]) });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching ring:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
};

// Create new ring (admin only)
const createRing = async (req, res) => {
  try {
    const {
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
    } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO rings 
       (ring_identifier, ring_name, model_id, size, material, price, 
        status, location_type, location_label, image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        ring_identifier,
        ring_name,
        model_id,
        size,
        material,
        price,
        status || 'AVAILABLE',
        location_type || 'WAREHOUSE',
        location_label,
        image_url
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Ring created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating ring:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
};

// Update ring (admin only)
const updateRing = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    
    fields.push('updated_at = NOW()');
    values.push(id);
    
    const [result] = await pool.execute(
      `UPDATE rings SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ring not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Ring updated successfully'
    });
  } catch (error) {
    console.error('Error updating ring:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
};

// Delete ring (admin only)
const deleteRing = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute('DELETE FROM rings WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ring not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Ring deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ring:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
};

// Test ring connection
const testRingConnection = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      `UPDATE rings SET last_seen_at = NOW() WHERE id = ? OR ring_identifier = ?`,
      [id, id]
    );
    
    res.json({
      success: true,
      message: 'Connection test successful',
      data: { lastPing: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};

// Unpair ring
const unpairRing = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [ringRows] = await pool.execute(
      'SELECT id FROM rings WHERE id = ? OR ring_identifier = ?',
      [id, id]
    );
    
    if (ringRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ring not found'
      });
    }
    
    const ringDbId = ringRows[0].id;
    
    await pool.execute(
      `DELETE FROM ring_pair_links WHERE ring_id = ?`,
      [ringDbId]
    );
    
    await pool.execute(
      `UPDATE rings SET status = 'AVAILABLE' WHERE id = ?`,
      [ringDbId]
    );
    
    res.json({
      success: true,
      message: 'Ring unpaired successfully'
    });
  } catch (error) {
    console.error('Error unpairing ring:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};

module.exports = {
  getAllRings,
  getShopRings,
  getFilterOptions,
  getRingByIdentifier,
  getRingById,
  createRing,
  updateRing,
  deleteRing,
  testRingConnection,
  unpairRing
};
