
const express = require('express');
const { query } = require('../config/db');

const router = express.Router();

function requireAdmin(req, res, next) {
  const roleHeader = String(req.header('x-auth-roles') || '')
    .trim()
    .toLowerCase();

  if (roleHeader !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  return next();
}

router.get('/system', async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT id, shop_name, support_email, currency, updated_at FROM system_settings ORDER BY id ASC LIMIT 1',
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'System settings not found.' });
    }

    return res.json({
      message: 'System settings loaded.',
      settings: rows[0],
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/system', async (req, res, next) => {
  try {
    const { shop_name, support_email, currency } = req.body || {};
    const normalizedShopName = String(shop_name || '').trim();
    const normalizedSupportEmail = String(support_email || '').trim();
    const normalizedCurrency = String(currency || '').trim().toUpperCase();

    if (!normalizedShopName || !normalizedSupportEmail || !normalizedCurrency) {
      return res.status(400).json({
        message: 'shop_name, support_email, and currency are required.',
      });
    }

    const rows = await query('SELECT id FROM system_settings ORDER BY id ASC LIMIT 1');

    if (!rows.length) {
      const result = await query(
        'INSERT INTO system_settings (shop_name, support_email, currency) VALUES (?, ?, ?)',
        [normalizedShopName, normalizedSupportEmail, normalizedCurrency],
      );

      const created = await query(
        'SELECT id, shop_name, support_email, currency, updated_at FROM system_settings WHERE id = ? LIMIT 1',
        [result.insertId],
      );

      return res.status(201).json({
        message: 'System settings created successfully.',
        settings: created[0],
      });
    }

    const settingsId = rows[0].id;

    await query(
      'UPDATE system_settings SET shop_name = ?, support_email = ?, currency = ? WHERE id = ?',
      [normalizedShopName, normalizedSupportEmail, normalizedCurrency, settingsId],
    );

    const updated = await query(
      'SELECT id, shop_name, support_email, currency, updated_at FROM system_settings WHERE id = ? LIMIT 1',
      [settingsId],
    );

    return res.json({
      message: 'System settings saved successfully.',
      settings: updated[0],
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/notifications/:userId', async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Valid userId is required.' });
    }

    const rows = await query(
      `SELECT id, user_id, system_updates, created_at
       FROM notification_preferences
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [userId],
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Notification preferences not found.' });
    }

    return res.json({
      message: 'Notification preferences loaded.',
      preferences: rows[0],
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/notifications/:userId', async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Valid userId is required.' });
    }

    const systemUpdates = Boolean(req.body?.system_updates);

    const existing = await query(
      'SELECT id FROM notification_preferences WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [userId],
    );

    if (!existing.length) {
      const created = await query(
        'INSERT INTO notification_preferences (user_id, system_updates) VALUES (?, ?)',
        [userId, systemUpdates],
      );

      const createdRow = await query(
        `SELECT id, user_id, system_updates, created_at
         FROM notification_preferences
         WHERE id = ?
         LIMIT 1`,
        [created.insertId],
      );

      return res.status(201).json({
        message: 'Notification preferences created successfully.',
        preferences: createdRow[0],
      });
    }

    await query('UPDATE notification_preferences SET system_updates = ? WHERE id = ?', [
      systemUpdates,
      existing[0].id,
    ]);

    const updated = await query(
      `SELECT id, user_id, system_updates, created_at
       FROM notification_preferences
       WHERE id = ?
       LIMIT 1`,
      [existing[0].id],
    );

    return res.json({
      message: 'Notification preferences saved successfully.',
      preferences: updated[0],
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
