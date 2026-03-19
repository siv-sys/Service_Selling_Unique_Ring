const { pool } = require('../config/database');

class RingModel {
  // Get all rings with filtering and pagination
  async findAll(filters = {}, pagination = {}) {
    const { material, minPrice, maxPrice, status, search } = filters;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, 
             rm.model_name, 
             rm.collection_name, 
             rm.image_url as model_image,
             rm.description as model_description
      FROM rings r
      LEFT JOIN ring_models rm ON r.model_id = rm.id
      WHERE 1=1
    `;
    const params = [];

    if (material) {
      query += ` AND r.material LIKE ?`;
      params.push(`%${material}%`);
    }

    if (minPrice) {
      query += ` AND r.price >= ?`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ` AND r.price <= ?`;
      params.push(parseFloat(maxPrice));
    }

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (r.ring_name LIKE ? OR r.ring_identifier LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Get total count
    const countQuery = query.replace(
      'SELECT r.*, rm.model_name, rm.collection_name, rm.image_url as model_image, rm.description as model_description',
      'SELECT COUNT(*) as total'
    );
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rings] = await pool.query(query, params);

    return {
      data: rings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get single ring by ID
  async findById(id) {
    const [rings] = await pool.query(`
      SELECT r.*, 
             rm.model_name, 
             rm.collection_name, 
             rm.image_url as model_image,
             rm.description as model_description
      FROM rings r
      LEFT JOIN ring_models rm ON r.model_id = rm.id
      WHERE r.id = ?
    `, [id]);

    return rings.length > 0 ? rings[0] : null;
  }

  // Get ring by identifier
  async findByIdentifier(identifier) {
    const [rings] = await pool.query(`
      SELECT r.*, rm.model_name, rm.collection_name
      FROM rings r
      LEFT JOIN ring_models rm ON r.model_id = rm.id
      WHERE r.ring_identifier = ?
    `, [identifier]);

    return rings.length > 0 ? rings[0] : null;
  }

  // Create new ring
  async create(ringData) {
    const {
      ring_identifier,
      ring_name,
      model_id,
      size,
      material,
      price,
      status = 'AVAILABLE',
      location_type = 'WAREHOUSE',
      location_label = null
    } = ringData;

    // Generate identifier if not provided
    const finalIdentifier = ring_identifier || this.generateIdentifier(ring_name);

    const [result] = await pool.query(`
      INSERT INTO rings (
        ring_identifier, ring_name, model_id, size, 
        material, price, status, location_type, location_label
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      finalIdentifier, 
      ring_name, 
      model_id || null, 
      size || null,
      material, 
      price, 
      status, 
      location_type, 
      location_label
    ]);

    return {
      id: result.insertId,
      ring_identifier: finalIdentifier,
      ...ringData
    };
  }

  // Generate unique ring identifier
  generateIdentifier(ringName) {
    const prefix = ringName.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${randomNum}-${timestamp}`;
  }

  // Update ring
  async update(id, ringData) {
    const updates = [];
    const params = [];

    const allowedFields = [
      'ring_name', 'model_id', 'size', 'material',
      'price', 'status', 'location_type', 'location_label'
    ];

    allowedFields.forEach(field => {
      if (ringData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(ringData[field]);
      }
    });

    if (updates.length === 0) {
      return this.findById(id);
    }

    params.push(id);
    await pool.query(
      `UPDATE rings SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  // Delete ring
  async delete(id) {
    const [result] = await pool.query('DELETE FROM rings WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Get shop rings (available for purchase)
  async getShopRings(filters = {}, pagination = {}) {
    const { minPrice, maxPrice, material } = filters;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, rm.model_name, rm.collection_name, rm.image_url
      FROM rings r
      LEFT JOIN ring_models rm ON r.model_id = rm.id
      WHERE r.status = 'AVAILABLE'
    `;
    const params = [];

    if (minPrice) {
      query += ` AND r.price >= ?`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ` AND r.price <= ?`;
      params.push(parseFloat(maxPrice));
    }

    if (material) {
      query += ` AND r.material LIKE ?`;
      params.push(`%${material}%`);
    }

    // Get total count
    const countQuery = query.replace(
      'SELECT r.*, rm.model_name, rm.collection_name, rm.image_url',
      'SELECT COUNT(*) as total'
    );
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rings] = await pool.query(query, params);

    return {
      data: rings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get filter options
  async getFilterOptions() {
    const [materials] = await pool.query(`
      SELECT DISTINCT material FROM rings ORDER BY material
    `);

    const [priceRange] = await pool.query(`
      SELECT MIN(price) as min_price, MAX(price) as max_price FROM rings
    `);

    const [statuses] = await pool.query(`
      SELECT DISTINCT status FROM rings ORDER BY status
    `);

    const [collections] = await pool.query(`
      SELECT DISTINCT collection_name FROM ring_models 
      WHERE collection_name IS NOT NULL
      ORDER BY collection_name
    `);

    return {
      materials: materials.map(m => m.material),
      collections: collections.map(c => c.collection_name).filter(Boolean),
      statuses: statuses.map(s => s.status),
      priceRange: priceRange[0]
    };
  }
}

module.exports = new RingModel();