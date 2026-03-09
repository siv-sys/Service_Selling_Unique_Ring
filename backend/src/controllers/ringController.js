const { pool } = require('../../config/database');
const { redisClient } = require('../../config/redis');

// Get all rings with filters
const getRings = async (req, res) => {
  try {
    const { 
      material, 
      minPrice, 
      maxPrice, 
      status,
      limit = 50, 
      offset = 0 
    } = req.query;
    
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
    
    // Get total count
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
    console.error('Error fetching rings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
};

// Get single ring by ID
const getRingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try Redis cache first
    const cachedRing = await redisClient.get(`ring:${id}`);
    if (cachedRing) {
      return res.json({
        success: true,
        data: JSON.parse(cachedRing),
        cached: true
      });
    }
    
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
    
    // Cache for 1 hour
    await redisClient.setEx(`ring:${id}`, 3600, JSON.stringify(rows[0]));
    
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

// Get filter options
const getFilterOptions = async (req, res) => {
  try {
    // Try cache first
    const cached = await redisClient.get('ring:filters');
    if (cached) {
      return res.json({ 
        success: true, 
        data: JSON.parse(cached), 
        cached: true 
      });
    }
    
    // Get unique materials
    const [materials] = await pool.execute(
      'SELECT DISTINCT material FROM rings WHERE material IS NOT NULL AND material != ""'
    );
    
    // Get price range
    const [priceRange] = await pool.execute(
      'SELECT MIN(price) as min_price, MAX(price) as max_price FROM rings'
    );
    
    const filterData = {
      materials: materials.map(m => m.material).filter(Boolean),
      priceRange: priceRange[0] || { min_price: 0, max_price: 10000 }
    };
    
    // Cache for 1 hour
    await redisClient.setEx('ring:filters', 3600, JSON.stringify(filterData));
    
    res.json({ success: true, data: filterData });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
};

module.exports = {
  getRings,
  getRingById,
  getFilterOptions
};