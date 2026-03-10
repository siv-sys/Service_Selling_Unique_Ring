<<<<<<< HEAD
﻿
const express = require('express');
const cors = require('cors');
const { env } = require('./config/env.js');
const { query } = require('./config/db.js');
const adminMigrationsRoutes = require('./routes/admin-migrations.routes.js');
=======
<<<<<<< HEAD
﻿
const express = require('express');
const cors = require('cors');
const env = require('./config/env');

const healthRoutes = require('./routes/health.routes');
const inventoryRoutes = require('./routes/inventory.routes');
>>>>>>> feature/ringInventory

const app = express();

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
<<<<<<< HEAD
  }),
);
=======
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
=======
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const env = require('./config/env');
const { ping } = require('./config/db');

const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(cors({ origin: env.frontendOrigin }));
>>>>>>> feature/ringInventory
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
<<<<<<< HEAD
    await query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: 'connected' });
  } catch (_error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/admin/migrations', adminMigrationsRoutes);
=======
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
>>>>>>> feature/admin_dashboard
>>>>>>> feature/ringInventory

module.exports = app;
