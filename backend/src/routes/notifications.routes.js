const express = require('express');
const { query } = require('../config/db');
const { createNotification } = require('../services/notifications.service');

const router = express.Router();

router.get('/me', async (req, res) => {
  try {
    const requestedUserId = Number(req.header('x-auth-user-id'));
    const userId = Number.isFinite(requestedUserId) && requestedUserId > 0 ? requestedUserId : 1;

    const rows = await query(
      `
        SELECT id, type, icon, icon_class, action_key, title, message, unread, metadata, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 20
      `,
      [userId]
    );

    return res.json(
      rows.map((row) => ({
        id: String(row.id),
        icon: row.icon || '\u2699',
        iconClass: row.icon_class,
        actionKey: row.action_key,
        title: row.title,
        message: row.message,
        createdAt: row.created_at,
        unread: Boolean(row.unread),
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/me/read-all', async (req, res) => {
  try {
    const requestedUserId = Number(req.header('x-auth-user-id'));
    const userId = Number.isFinite(requestedUserId) && requestedUserId > 0 ? requestedUserId : 1;

    await query(
      `
        UPDATE notifications
        SET unread = 0, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
        WHERE user_id = ? AND unread = 1
      `,
      [userId]
    );

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/me/:notificationId/read', async (req, res) => {
  try {
    const requestedUserId = Number(req.header('x-auth-user-id'));
    const userId = Number.isFinite(requestedUserId) && requestedUserId > 0 ? requestedUserId : 1;
    const notificationId = Number(req.params.notificationId);

    if (!Number.isFinite(notificationId) || notificationId <= 0) {
      return res.status(400).json({ message: 'Invalid notification id' });
    }

    await query(
      `
        UPDATE notifications
        SET
          unread = 0,
          read_at = COALESCE(read_at, CURRENT_TIMESTAMP),
          clicked_at = CURRENT_TIMESTAMP,
          opened_count = opened_count + 1
        WHERE id = ? AND user_id = ?
      `,
      [notificationId, userId]
    );

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const notification = await createNotification(req.body);
    return res.status(201).json(notification);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
