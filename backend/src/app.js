const express = require('express');
const cors = require('cors');
<<<<<<< HEAD
const fs = require('fs');
=======
>>>>>>> ef5cde89b20e9ceeecbac3d8171cd2af67dcf559
const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const { ping } = require('./config/db');
<<<<<<< HEAD
=======

// Import routes
const healthRoutes = require('./routes/health.routes');
>>>>>>> ef5cde89b20e9ceeecbac3d8171cd2af67dcf559
const dashboardRoutes = require('./routes/dashboard.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const pairsRoutes = require('./routes/pairs.routes');
const adminMigrationsRoutes = require('./routes/admin-migrations.routes');
const ringModelsRoutes = require('./routes/ring-models.routes');
const ringsRoutes = require('./routes/rings.routes');
const scansRoutes = require('./routes/scans.routes');

const app = express();

<<<<<<< HEAD
app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json());
=======
// Middleware
app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
>>>>>>> ef5cde89b20e9ceeecbac3d8171cd2af67dcf559

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await ping();
    res.json({
      ok: true,
      db: 'connected',
      service: 'service-selling-unique-ring-backend',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      db: 'disconnected',
      error: error.message,
      service: 'service-selling-unique-ring-backend',
      timestamp: new Date().toISOString(),
    });
  }
});

// Mount routes
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/pairs', pairsRoutes);
app.use('/api/admin/migrations', adminMigrationsRoutes);
app.use('/api/ring-models', ringModelsRoutes);
app.use('/api/rings', ringsRoutes);
app.use('/api/scans', scansRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// Optional frontend serving
const frontendDistDir = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistDir)) {
  app.use(express.static(frontendDistDir));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ message: 'Not found' });
    res.sendFile(path.join(frontendDistDir, 'index.html'));
  });
}

module.exports = app;
