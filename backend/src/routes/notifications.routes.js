const express = require('express');
const { query } = require('../config/db');
const { createNotification } = require('../services/notifications.service');

const router = express.Router();

router.post('/support-message', async (req, res) => {
  try {
    const senderId = Number(req.auth?.user?.id || 0);
    const senderName = String(req.auth?.user?.name || req.auth?.user?.email || 'Member').trim() || 'Member';
    const subject = String(req.body?.subject || 'Receipt verification request').trim() || 'Receipt verification request';
    const message = String(req.body?.message || '').trim();
    const attachment = String(req.body?.attachment || '').trim();
    const attachmentName = String(req.body?.attachmentName || '').trim();

    if (!message && !attachment) {
      return res.status(400).json({ message: 'Message or receipt image is required.' });
    }

    const adminRows = await query(
      `
        SELECT id
        FROM users
        WHERE COALESCE(role, 'user') = 'admin'
          AND COALESCE(account_status, 'ACTIVE') = 'ACTIVE'
      `
    );

    if (!adminRows.length) {
      return res.status(404).json({ message: 'No admin users are available right now.' });
    }

    const messageTitle = `${senderName}: ${subject} #${Date.now()}`.slice(0, 160);
    const messageBody = `${senderName} sent a support message: ${message}`.slice(0, 500);
    const metadata = {
      senderId: Number.isFinite(senderId) && senderId > 0 ? senderId : null,
      senderName,
      subject,
      message,
      attachment,
      attachmentName,
    };

    const results = await Promise.all(
      adminRows.map((row) =>
        createNotification({
          userId: row.id,
          type: 'support_message',
          icon: 'chat',
          iconClass: 'message',
          actionKey: 'support_message',
          title: messageTitle,
          message: attachment ? `${messageBody} Receipt attached.` : messageBody,
          unread: true,
          metadata,
        }).catch((error) => ({
          error: error.message,
          userId: row.id,
        })),
      ),
    );

    return res.status(201).json({
      created: results.filter((item) => item && !item.error).length,
      totalAdmins: adminRows.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/payment-received', async (req, res) => {
  try {
    const purchaserId = Number(req.auth?.user?.id || 0);
    const customerName = String(req.body?.customerName || req.body?.buyerName || 'A customer').trim() || 'A customer';
    const ringName = String(req.body?.ringName || req.body?.ring || 'a ring').trim() || 'a ring';
    const sku = String(req.body?.sku || '').trim();
    const orderNumber = String(req.body?.orderNumber || req.body?.orderNo || '').trim();
    const paymentMethod = String(req.body?.paymentMethod || 'online payment').trim() || 'online payment';
    const total = Number(req.body?.total || req.body?.amount || 0);
    const paidAt = String(req.body?.paidAt || new Date().toISOString()).trim();

    const adminRows = await query(
      `
        SELECT id
        FROM users
        WHERE COALESCE(role, 'user') = 'admin'
          AND COALESCE(account_status, 'ACTIVE') = 'ACTIVE'
      `
    );

    if (!adminRows.length) {
      return res.status(404).json({ message: 'No admin users available to notify.' });
    }

    const title = orderNumber ? `Payment received ${orderNumber}` : 'Payment received';
    const amountText = Number.isFinite(total) && total > 0 ? ` totaling $${total}` : '';
    const ringText = sku ? `${ringName} (${sku})` : ringName;
    const message = `${customerName} completed payment for ${ringText}${amountText} using ${paymentMethod}.`;
    const metadata = {
      customerName,
      ringName,
      sku,
      orderNumber,
      paymentMethod,
      total,
      paidAt,
      purchaserId: Number.isFinite(purchaserId) && purchaserId > 0 ? purchaserId : null,
    };

    const created = await Promise.all(
      adminRows.map((row) =>
        createNotification({
          userId: row.id,
          type: 'payment_received',
          icon: '$',
          iconClass: 'payment',
          actionKey: 'review-payment',
          title,
          message,
          unread: true,
          metadata,
        }).catch((error) => ({
          error: error.message,
          userId: row.id,
        })),
      ),
    );

    return res.status(201).json({
      created: created.filter((item) => item && !item.error).length,
      totalAdmins: adminRows.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

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
