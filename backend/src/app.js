
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: false,
  }),
);
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.json({
    message: 'Service Selling Unique Ring backend is running.',
    health: '/api/health',
    settings: '/api/settings/system',
    adminProfile: '/api/settings/admin-profile',
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'API is available.',
    endpoints: [
      '/api/health',
      '/api/settings/system',
      '/api/settings/notifications/:userId',
      '/api/settings/admin-profile',
    ],
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/settings', settingsRoutes);

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    message: 'Internal server error.',
    error: err.message,
  });
});

module.exports = app;
