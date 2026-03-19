const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { requireAdmin, requireAuth } = require('./middleware/auth.middleware');

const authRoutes = require('./routes/auth.routes');
const loginRoutes = require('./routes/login.routes');
const healthRoutes = require('./routes/health.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));

/*
|--------------------------------------------------------------------------
| Root Routes
|--------------------------------------------------------------------------
*/

app.get('/', (_req, res) => {
  res.json({
    message: 'Service Selling Unique Ring backend is running.',
    api: '/api',
  });
});

app.get('/api', (_req, res) => {
  res.json({
    message: 'API is available.',
    endpoints: [
      '/api/health',
      '/api/dashboard',
      '/api/inventory',
      '/api/settings/system',
      '/api/settings/notifications/:userId',
    ],
  });
});

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/login', loginRoutes);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/inventory', requireAuth, requireAdmin, inventoryRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((_req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;

  console.error('API Error:', err);

  res.status(statusCode).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
