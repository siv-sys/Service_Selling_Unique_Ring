
const express = require('express');
const cors = require('cors');
const env = require('./config/env');

const healthRoutes = require('./routes/health.routes');
const inventoryRoutes = require('./routes/inventory.routes');

const app = express();

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api', (_req, res) => {
  res.json({
    message: 'Service Selling Unique Ring API',
    version: '1.0.0',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/inventory', inventoryRoutes);

app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
