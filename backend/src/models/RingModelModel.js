const { pool } = require('../config/database');

class RingModelModel {
  // Get all ring models
  async findAll(filters = {}) {
    const { collection } = filters;
    
    let query = 'SELECT * FROM ring_models WHERE 1=1';
    const params = [];

    if (collection) {
      query += ' AND collection_name = ?';
      params.push(collection);
    }

    query += ' ORDER BY model_name';

    const [models] = await pool.query(query, params);
    return models;
  }

  // Get model by ID
  async findById(id) {
    const [models] = await pool.query(
      'SELECT * FROM ring_models WHERE id = ?',
      [id]
    );
    return models.length > 0 ? models[0] : null;
  }

  // Create new model
  async create(modelData) {
    const {
      model_name,
      collection_name,
      material,
      description,
      image_url,
      base_price,
      currency_code = 'USD'
    } = modelData;

    const [result] = await pool.query(`
      INSERT INTO ring_models (
        model_name, collection_name, material, description, 
        image_url, base_price, currency_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [model_name, collection_name, material, description, image_url, base_price, currency_code]);

    return {
      id: result.insertId,
      ...modelData
    };
  }

  // Get collections
  async getCollections() {
    const [collections] = await pool.query(`
      SELECT DISTINCT collection_name, COUNT(*) as model_count
      FROM ring_models
      WHERE collection_name IS NOT NULL
      GROUP BY collection_name
      ORDER BY collection_name
    `);
    return collections;
  }
}

module.exports = new RingModelModel();