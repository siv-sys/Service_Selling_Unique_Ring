const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const { query } = require('./config/db');
const { requireAdmin, requireAuth } = require('./middleware/auth.middleware');
const { createNotification } = require('./services/notifications.service');

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

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/login', loginRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/public-profile', publicProfileRoutes);
app.use('/api/couple-shop', coupleShopRoutes);
app.use('/api/rings', ringRoutes);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/inventory', requireAuth, requireAdmin, inventoryRoutes);
app.use('/api/notifications', requireAuth, notificationsRoutes);
app.use('/api/profile', requireAuth, profileRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);
app.use('/api/users', requireAuth, usersRoutes);
app.use('/api/admin/migrations', requireAuth, requireAdmin, adminRoutes);
app.use('/api/admin/pairs', requireAuth, requireAdmin, adminPairsRoutes);
app.use('/api/pair-invitations', requireAuth, pairInvitationsRoutes);
app.use('/api/pairs', requireAuth, pairsRoutes);

app.post('/api/support-message', requireAuth, async (req, res) => {
  try {
    const senderId = Number(req.auth?.user?.id || 0);
    const senderName = String(req.auth?.user?.name || req.auth?.user?.email || 'Member').trim() || 'Member';
    const subject = String(req.body?.subject || 'Receipt verification request').trim() || 'Receipt verification request';
    const message = String(req.body?.message || '').trim();
    const attachment = String(req.body?.attachment || '').trim();
    const attachmentName = String(req.body?.attachmentName || '').trim();

    if (!message && !attachment) {
      return res.status(400).json({ message: 'Message or receipt image is required.' });
    }

    const adminRows = await query(
      `
        SELECT id
        FROM users
        WHERE COALESCE(role, 'user') = 'admin'
          AND COALESCE(account_status, 'ACTIVE') = 'ACTIVE'
      `
    );

    if (!adminRows.length) {
      return res.status(404).json({ message: 'No admin users are available right now.' });
    }

    const title = `${senderName}: ${subject} #${Date.now()}`.slice(0, 160);
    const body = `${senderName} sent a support message: ${message || 'Receipt attached.'}`.slice(0, 500);
    const metadata = {
      senderId: Number.isFinite(senderId) && senderId > 0 ? senderId : null,
      senderName,
      subject,
      message,
      attachment,
      attachmentName,
    };

    const created = await Promise.all(
      adminRows.map((row) =>
        createNotification({
          userId: row.id,
          type: 'support_message',
          icon: 'chat',
          iconClass: 'message',
          actionKey: 'support_message',
          title,
          message: attachment ? `${body} Receipt attached.` : body,
          unread: true,
          metadata,
        }).catch((error) => ({
          error: error.message,
          userId: row.id,
        })),
      ),
    );

    return res.status(201).json({
      created: created.filter((item) => item && !item.error).length,
      totalAdmins: adminRows.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

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
