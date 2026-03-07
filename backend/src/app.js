const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const env = require('./config/env');
const { ping } = require('./config/db');

const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
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

app.use('/api/dashboard', dashboardRoutes);

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
