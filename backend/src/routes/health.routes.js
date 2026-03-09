const express = require('express');
const { query } = require('../config/db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    await query('SELECT 1 AS ok');
    res.json({ ok: true, database: 'connected' });
  } catch (error) {
    res.status(500).json({ ok: false, database: 'disconnected', message: error.message });
  }
});

module.exports = router;
﻿
