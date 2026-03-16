const express = require('express');
const { env } = require('../config/env.js');
const {
  getMigrationStatus,
  runPendingMigrations,
  runPendingSchemaMigrations,
  runSeedCatalogMigration,
  runCustomCatalogSeedMigration,
} = require('../services/migration-service.js');

const router = express.Router();

router.get('/status', async (_req, res) => {
  try {
    const status = await getMigrationStatus();
    res.json({
      database: env.db.name,
      ...status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to get migration status' });
  }
});

router.post('/run', async (_req, res) => {
  try {
    const result = await runPendingMigrations();
    res.json({
      message: result.appliedCount > 0 ? 'Migrations applied successfully.' : 'Database is already up to date.',
      appliedCount: result.appliedCount,
      appliedMigrations: result.appliedMigrations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to run migrations' });
  }
});

router.post('/seed-catalog', async (req, res) => {
  try {
    await runPendingSchemaMigrations();
    const hasCustomPayload = typeof req.body?.modelName === 'string' && req.body.modelName.trim().length > 0;
    const result = hasCustomPayload
      ? await runCustomCatalogSeedMigration(req.body)
      : await runSeedCatalogMigration();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to run seed migration' });
  }
});

module.exports = router;
