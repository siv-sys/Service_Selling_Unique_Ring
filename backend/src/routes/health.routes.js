
const express = require('express');
<<<<<<< HEAD
const { pingDb } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await pingDb();
    res.json({
      status: 'ok',
      db: 'connected',
=======
const { ping } = require('../config/db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    await ping();
    res.json({
      status: 'ok',
      database: 'connected',
>>>>>>> feature/ringInventory
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
<<<<<<< HEAD
      db: 'disconnected',
      message: error.message,
=======
      database: 'disconnected',
      message: error.message,
      timestamp: new Date().toISOString(),
>>>>>>> feature/ringInventory
    });
  }
});

module.exports = router;
