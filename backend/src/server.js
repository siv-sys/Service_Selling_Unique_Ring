const app = require('./app');
const env = require('./config/env');
const { initializeCoreTables, ping } = require('./config/db');

async function startServer() {
  let dbReady = false;
  try {
    await ping();
    await initializeCoreTables();
    dbReady = true;
  } catch (error) {
    console.warn(`Database startup check failed: ${error.message}`);
    console.warn('Server will start, but database-backed endpoints may fail until DB config is fixed.');
  }

  app.locals.dbReady = dbReady;

  const server = app.listen(env.port, () => {
    console.log(`Backend running at http://localhost:${env.port}`);
    console.log(`Database: ${env.db.database}`);
    console.log(`Database status: ${dbReady ? 'connected' : 'disconnected'}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${env.port} is already in use.`);
    } else if (error.code === 'EACCES') {
      console.error(`Insufficient permission for port ${env.port}.`);
    } else {
      console.error('Server startup error:', error.message);
    }
    process.exit(1);
  });
}

void startServer();
﻿const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Import routes
const ringRoutes = require('./routes/ringRoutes');
const coupleRoutes = require('./routes/coupleRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes'); // Make sure this line is present

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

// Make db available to routes
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// API Routes
app.use('/api/rings', ringRoutes);
app.use('/api/couples', coupleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes); // ADD THIS LINE

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ success: true, status: 'OK', database: 'connected' });
  } catch (error) {
    res.json({ success: true, status: 'OK', database: 'disconnected' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/rings`);
  console.log(`   GET  /api/rings/shop`);
  console.log(`   GET  /api/rings/filter-options`);
  console.log(`   GET  /api/rings/:id`);
  console.log(`   GET  /api/cart`); // Add this to the list
  console.log(`   POST /api/cart/add`); // Add this to the list
  console.log(`   PUT  /api/cart/:id`); // Add this to the list
  console.log(`   DEL  /api/cart/:id`); // Add this to the list
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
});
