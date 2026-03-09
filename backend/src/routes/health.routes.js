
const express = require('express');
const { pingDb } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await pingDb();
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
