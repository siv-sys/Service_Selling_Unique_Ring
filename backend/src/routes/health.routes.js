const express = require('express');
const { testConnection } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await testConnection();
    res.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      db: 'disconnected',
      message: error.message,
    });
  }
});

module.exports = router;
