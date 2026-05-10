const { query } = require('../config/db');

async function getActiveAdminIds() {
  const rows = await query(
    `
      SELECT id
      FROM users
      WHERE COALESCE(role, 'user') = 'admin'
        AND COALESCE(account_status, 'ACTIVE') = 'ACTIVE'
    `
  );

  return rows.map((row) => row.id);
}

async function createNotification({
  userId,
  type,
  icon = '\u2699',
  iconClass = 'system',
  actionKey = null,
  title,
  message,
  unread = true,
  metadata = null,
}) {
  if (!userId || !type || !title || !message) {
    throw new Error('userId, type, title, and message are required');
  }

  const result = await query(
    `
      INSERT INTO notifications (user_id, type, icon, icon_class, action_key, title, message, unread, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        icon = VALUES(icon),
        icon_class = VALUES(icon_class),
        action_key = VALUES(action_key),
        message = VALUES(message),
        unread = VALUES(unread),
        metadata = VALUES(metadata),
        created_at = CURRENT_TIMESTAMP,
        read_at = NULL,
        clicked_at = NULL,
        opened_count = 0
    `,
    [userId, type, icon, iconClass, actionKey, title, message, unread ? 1 : 0, metadata ? JSON.stringify(metadata) : null]
  );

  return {
    id: result.insertId || null,
    userId,
    type,
    icon,
    iconClass,
    actionKey,
    title,
    message,
    unread: Boolean(unread),
    metadata,
  };
}

async function createAdminNotifications(notification) {
  const adminIds = await getActiveAdminIds();

  if (!adminIds.length) {
    return { created: 0, totalAdmins: 0 };
  }

  const results = await Promise.all(
    adminIds.map((userId) =>
      createNotification({
        ...notification,
        userId,
      }).catch((error) => ({
        error: error.message,
        userId,
      })),
    ),
  );

  return {
    created: results.filter((item) => item && !item.error).length,
    totalAdmins: adminIds.length,
  };
}

async function createSupportMessageNotifications({ sender, subject, message, attachment, attachmentName }) {
  const senderId = Number(sender?.id || 0);
  const senderName = String(sender?.name || sender?.email || 'Member').trim() || 'Member';
  const trimmedSubject = String(subject || 'Receipt verification request').trim() || 'Receipt verification request';
  const trimmedMessage = String(message || '').trim();
  const trimmedAttachment = String(attachment || '').trim();
  const trimmedAttachmentName = String(attachmentName || '').trim();

  if (!trimmedMessage && !trimmedAttachment) {
    const error = new Error('Message or receipt image is required.');
    error.statusCode = 400;
    throw error;
  }

  const body = `${senderName} sent a support message: ${trimmedMessage || 'Receipt attached.'}`.slice(0, 500);
  const notificationMessage = trimmedAttachment && trimmedMessage ? `${body} Receipt attached.` : body;
  const result = await createAdminNotifications({
    type: 'support_message',
    icon: 'chat',
    iconClass: 'message',
    actionKey: 'support_message',
    title: `${senderName}: ${trimmedSubject} #${Date.now()}`.slice(0, 160),
    message: notificationMessage,
    unread: true,
    metadata: {
      senderId: Number.isFinite(senderId) && senderId > 0 ? senderId : null,
      senderName,
      subject: trimmedSubject,
      message: trimmedMessage,
      attachment: trimmedAttachment,
      attachmentName: trimmedAttachmentName,
    },
  });

  if (!result.totalAdmins) {
    const error = new Error('No admin users are available right now.');
    error.statusCode = 404;
    throw error;
  }

  return result;
}

async function createPaymentReceivedNotifications({
  purchaser,
  customerName,
  buyerName,
  ringName,
  ring,
  sku,
  orderNumber,
  orderNo,
  paymentMethod,
  total,
  amount,
  paidAt,
}) {
  const purchaserId = Number(purchaser?.id || 0);
  const safeCustomerName = String(customerName || buyerName || 'A customer').trim() || 'A customer';
  const safeRingName = String(ringName || ring || 'a ring').trim() || 'a ring';
  const safeSku = String(sku || '').trim();
  const safeOrderNumber = String(orderNumber || orderNo || '').trim();
  const safePaymentMethod = String(paymentMethod || 'online payment').trim() || 'online payment';
  const safeTotal = Number(total || amount || 0);
  const safePaidAt = String(paidAt || new Date().toISOString()).trim();
  const amountText = Number.isFinite(safeTotal) && safeTotal > 0 ? ` totaling $${safeTotal}` : '';
  const ringText = safeSku ? `${safeRingName} (${safeSku})` : safeRingName;

  const result = await createAdminNotifications({
    type: 'payment_received',
    icon: '$',
    iconClass: 'payment',
    actionKey: 'review-payment',
    title: safeOrderNumber ? `Payment received ${safeOrderNumber}` : 'Payment received',
    message: `${safeCustomerName} completed payment for ${ringText}${amountText} using ${safePaymentMethod}.`,
    unread: true,
    metadata: {
      customerName: safeCustomerName,
      ringName: safeRingName,
      sku: safeSku,
      orderNumber: safeOrderNumber,
      paymentMethod: safePaymentMethod,
      total: safeTotal,
      paidAt: safePaidAt,
      purchaserId: Number.isFinite(purchaserId) && purchaserId > 0 ? purchaserId : null,
    },
  });

  if (!result.totalAdmins) {
    const error = new Error('No admin users available to notify.');
    error.statusCode = 404;
    throw error;
  }

  return result;
}

module.exports = {
  createAdminNotifications,
  createNotification,
  createPaymentReceivedNotifications,
  createSupportMessageNotifications,
  getActiveAdminIds,
};
