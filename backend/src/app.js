const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const relationshipRoutes = require('./routes/relationship.routes');

const app = express();

app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin }));
app.use(express.json());

app.get('/api', (_req, res) => {
  res.json({ ok: true, service: 'service-selling-unique-ring-backend' });
});

app.use('/api/health', healthRoutes);
app.use('/api/relationship', relationshipRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
﻿
