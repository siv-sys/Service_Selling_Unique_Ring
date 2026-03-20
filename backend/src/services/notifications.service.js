const { query } = require('../config/db');

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
    `,
    [userId, type, icon, iconClass, actionKey, title, message, unread ? 1 : 0, metadata ? JSON.stringify(metadata) : null]
  );

  return {
    id: result.insertId,
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

module.exports = {
  createNotification,
};
