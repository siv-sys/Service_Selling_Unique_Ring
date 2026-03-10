const express = require('express');
const { ping } = require('../config/db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    await ping();
    return res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
