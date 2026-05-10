const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const { requireAdmin, requireAuth } = require('./middleware/auth.middleware');

const authRoutes = require('./routes/auth.routes');
const loginRoutes = require('./routes/login.routes');
const cartRoutes = require('./routes/cartRoutes');
const healthRoutes = require('./routes/health.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const profileRoutes = require('./routes/profile.routes');
const publicProfileRoutes = require('./routes/public-profile.routes');
const ringRoutes = require('./routes/ringRoutes');
const settingsRoutes = require('./routes/settings.routes');
const usersRoutes = require('./routes/users.routes');
const adminRoutes = require('./routes/admin.routes');
const adminPairsRoutes = require('./routes/admin-pairs.routes');
const pairInvitationsRoutes = require('./routes/pair-invitations.routes');
const pairsRoutes = require('./routes/pairs.routes');
const coupleShopRoutes = require('./routes/couple-shop.routes');
const supportMessageRoutes = require('./routes/support-message.routes');

const app = express();
const publicRoutes = [
  ['/api/health', healthRoutes],
  ['/api/auth', authRoutes],
  ['/api/auth/login', loginRoutes],
  ['/api/cart', cartRoutes],
  ['/api/public-profile', publicProfileRoutes],
  ['/api/couple-shop', coupleShopRoutes],
  ['/api/rings', ringRoutes],
];
const authenticatedRoutes = [
  ['/api/dashboard', dashboardRoutes],
  ['/api/notifications', notificationsRoutes],
  ['/api/profile', profileRoutes],
  ['/api/settings', settingsRoutes],
  ['/api/support-message', supportMessageRoutes],
  ['/api/users', usersRoutes],
  ['/api/pair-invitations', pairInvitationsRoutes],
  ['/api/pairs', pairsRoutes],
];
const adminRoutesMap = [
  ['/api/inventory', inventoryRoutes],
  ['/api/admin/migrations', adminRoutes],
  ['/api/admin/pairs', adminPairsRoutes],
];

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

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

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
      '/api/rings',
      '/api/cart',
      '/api/dashboard',
      '/api/couple-shop',
      '/api/inventory',
      '/api/admin/pairs',
      '/api/notifications/me',
      '/api/profile/me/current',
      '/api/public-profile/:handle',
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

publicRoutes.forEach(([route, handler]) => app.use(route, handler));

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

authenticatedRoutes.forEach(([route, handler]) => app.use(route, requireAuth, handler));
adminRoutesMap.forEach(([route, handler]) => app.use(route, requireAuth, requireAdmin, handler));

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
