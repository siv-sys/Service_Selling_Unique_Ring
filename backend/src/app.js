const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const env = require('./config/env');
const { query, ping } = require('./config/db');

// Routes
const healthRoutes = require('./routes/health.routes');
const settingsRoutes = require('./routes/settings.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const adminMigrationsRoutes = require('./routes/admin-migrations.routes');
const adminSeedRoutes = require('./routes/admin-seed.routes');
const userPairsRoutes = require('./routes/user-pairs.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();

// Middleware
app.use(cors({
  origin: env.frontendOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Service Selling Unique Ring API',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/settings',
      '/api/inventory',
      '/api/dashboard',
      '/api/users',
      '/api/user-pairs',
      '/api/admin/migrations',
      '/api/admin/seed',
    ],
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/user-pairs', userPairsRoutes);
app.use('/api/admin/migrations', adminMigrationsRoutes);
app.use('/api/admin/seed', adminSeedRoutes);

// Health check endpoint
app.get('/api/health/db', async (req, res) => {
  try {
    await ping();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Serve frontend in production
const frontendDistDir = path.resolve(__dirname, '../../frontend/dist');
const frontendIndexPath = path.join(frontendDistDir, 'index.html');

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistDir));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    return res.sendFile(frontendIndexPath);
  });
}

module.exports = app;
