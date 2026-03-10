const { pool } = require('../../config/database');
const { redisClient } = require('../../config/redis');

// Get all rings (for admin)
const getAllRings = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM rings ORDER BY created_at DESC');
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
const getShopRings = async (req, res) => {
  try {
    const { material, minPrice, maxPrice, status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM rings WHERE 1=1';
    const params = [];
    
    if (material) {
      query += ' AND material LIKE ?';
      params.push(`%${material}%`);
    }
    
    if (minPrice) {
      query += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.execute(query, params);
    
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM rings');
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        returned: rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching shop rings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
};

// Get filter options
const getFilterOptions = async (req, res) => {
  try {
    const [materials] = await pool.execute(
      'SELECT DISTINCT material FROM rings WHERE material IS NOT NULL AND material != ""'
    );
    
    const [priceRange] = await pool.execute(
      'SELECT MIN(price) as min_price, MAX(price) as max_price FROM rings'
    );
    
    res.json({ 
      success: true, 
      data: {
        materials: materials.map(m => m.material).filter(Boolean),
        priceRange: priceRange[0] || { min_price: 0, max_price: 10000 }
      }
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
};

// Get ring by identifier
const getRingByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const [rows] = await pool.execute(
      'SELECT * FROM rings WHERE ring_identifier = ?',
      [identifier]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ring not found' 
      });
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
      'SELECT * FROM rings WHERE id = ? OR ring_identifier = ?',
      [id, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ring not found' 
      });
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