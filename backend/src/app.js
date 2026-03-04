
const express = require('express');
const cors = require('cors');
const { env } = require('./config/env.js');
const { query } = require('./config/db.js');
const adminMigrationsRoutes = require('./routes/admin-migrations.routes.js');

const app = express();

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: 'connected' });
  } catch (_error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/admin/migrations', adminMigrationsRoutes);

module.exports = app;
