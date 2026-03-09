const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ring_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// API Routes

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// Get all rings
app.get('/api/rings', async (req, res) => {
  try {
    const { material, minPrice, maxPrice, status } = req.query;
    
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
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching rings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
});

// Get single ring by ID
app.get('/api/rings/:id', async (req, res) => {
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
});

// Get filter options
app.get('/api/rings/filter-options', async (req, res) => {
  try {
    // Get unique materials
    const [materials] = await pool.execute(
      'SELECT DISTINCT material FROM rings WHERE material IS NOT NULL AND material != ""'
    );
    
    // Get price range
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
});

// Start server
async function startServer() {
  const dbConnected = await testConnection();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
    console.log(`📊 Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   GET  /api/health - Health check`);
    console.log(`   GET  /api/rings - Get all rings`);
    console.log(`   GET  /api/rings/filter-options - Get filter options`);
    console.log(`   GET  /api/rings/:id - Get ring by ID`);
  });
}

startServer();