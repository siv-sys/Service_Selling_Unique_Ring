<<<<<<< HEAD
const express = require('express');
const { testConnection } = require('../config/db');
=======
﻿
const express = require('express');
<<<<<<< HEAD
const { pingDb } = require('../config/db');
>>>>>>> feature/ringInventory

const router = express.Router();

router.get('/', async (req, res) => {
  try {
<<<<<<< HEAD
    await testConnection();
    res.json({
      status: 'ok',
      db: 'connected',
=======
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
<<<<<<< HEAD
      db: 'disconnected',
      message: error.message,
=======
      database: 'disconnected',
      message: error.message,
      timestamp: new Date().toISOString(),
>>>>>>> feature/ringInventory
>>>>>>> feature/ringInventory
    });
  }
});

module.exports = router;
