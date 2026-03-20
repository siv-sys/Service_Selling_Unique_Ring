
const express = require('express');
const { query } = require('../config/db');

const router = express.Router();

function getHeaderUserId(req) {
  const raw = String(req.header('x-auth-user-id') || '').trim();
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function pickPreferredColumn(availableColumns, candidates) {
  for (const candidate of candidates) {
    if (availableColumns.has(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function getUsersColumnMap() {
  const columns = await query('SHOW COLUMNS FROM users');
  const available = new Set(columns.map((column) => String(column.Field || '').toLowerCase()));

  const idColumn = pickPreferredColumn(available, ['id']);
  const emailColumn = pickPreferredColumn(available, ['email']);
  const fullNameColumn = pickPreferredColumn(available, ['full_name', 'name']);
  const roleColumn = pickPreferredColumn(available, ['role']);
  const avatarColumn = pickPreferredColumn(available, ['avatar_url', 'profile_image']);

  if (!idColumn || !emailColumn) {
    throw new Error('users table must contain id and email columns.');
  }

  return {
    idColumn,
    emailColumn,
    fullNameColumn,
    roleColumn,
    avatarColumn,
  };
}

async function resolveTargetUserId(req, columnMap) {
  const headerUserId = getHeaderUserId(req);
  if (headerUserId) {
    const matched = await query(
      `SELECT ${columnMap.idColumn} AS id
       FROM users
       WHERE ${columnMap.idColumn} = ?
       LIMIT 1`,
      [headerUserId],
    );
    if (matched.length) {
      return Number(matched[0].id);
    }
  }

  if (columnMap.roleColumn) {
    const adminRows = await query(
      `SELECT ${columnMap.idColumn} AS id
       FROM users
       WHERE LOWER(${columnMap.roleColumn}) = 'admin'
       ORDER BY ${columnMap.idColumn} ASC
       LIMIT 1`,
    );
    if (adminRows.length) {
      return Number(adminRows[0].id);
    }
  }

  const firstRows = await query(
    `SELECT ${columnMap.idColumn} AS id
     FROM users
     ORDER BY ${columnMap.idColumn} ASC
     LIMIT 1`,
  );
  return firstRows.length ? Number(firstRows[0].id) : null;
}

async function loadNotificationSettings(userId) {
  const rows = await query(
    `SELECT system_updates, security_alerts, order_placement, push_notifications
     FROM admin_profile_settings
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [userId],
  );

  if (rows.length) {
    return rows[0];
  }

  const fallbackRows = await query(
    `SELECT system_updates, security_alerts, order_placement, push_notifications
     FROM admin_profile_settings
     WHERE user_id IS NULL
     ORDER BY id DESC
     LIMIT 1`,
  );

  if (fallbackRows.length) {
    return fallbackRows[0];
  }

  return {
    system_updates: false,
    security_alerts: false,
    order_placement: false,
    push_notifications: false,
  };
}

async function buildAdminProfile(userId, columnMap) {
  const nameSelect = columnMap.fullNameColumn
    ? `${columnMap.fullNameColumn} AS full_name`
    : `'' AS full_name`;
  const roleSelect = columnMap.roleColumn ? `${columnMap.roleColumn} AS role` : `'' AS role`;
  const avatarSelect = columnMap.avatarColumn
    ? `${columnMap.avatarColumn} AS avatar_url`
    : `NULL AS avatar_url`;

  const users = await query(
    `SELECT ${columnMap.idColumn} AS id,
            ${columnMap.emailColumn} AS email,
            ${nameSelect},
            ${roleSelect},
            ${avatarSelect}
     FROM users
     WHERE ${columnMap.idColumn} = ?
     LIMIT 1`,
    [userId],
  );

  if (!users.length) {
    return null;
  }

  const notifications = await loadNotificationSettings(userId);

  return {
    id: Number(users[0].id),
    full_name: String(users[0].full_name || ''),
    role: String(users[0].role || ''),
    email: String(users[0].email || ''),
    avatar_url: users[0].avatar_url || '',
    system_updates: Boolean(notifications.system_updates),
    security_alerts: Boolean(notifications.security_alerts),
    order_placement: Boolean(notifications.order_placement),
    push_notifications: Boolean(notifications.push_notifications),
  };
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

router.get('/admin-profile', async (req, res, next) => {
  try {
    const columnMap = await getUsersColumnMap();
    const userId = await resolveTargetUserId(req, columnMap);

    if (!userId) {
      return res.status(404).json({ message: 'Admin profile settings not found.' });
    }

    const profile = await buildAdminProfile(userId, columnMap);
    if (!profile) {
      return res.status(404).json({ message: 'Admin profile settings not found.' });
    }

    return res.json({
      message: 'Admin profile settings loaded.',
      profile,
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/admin-profile', async (req, res, next) => {
  try {
    const fullName = String(req.body?.full_name || '').trim();
    const role = String(req.body?.role || '').trim();
    const email = String(req.body?.email || '').trim();
    const avatarUrl = String(req.body?.avatar_url || '').trim();
    const systemUpdates = Boolean(req.body?.system_updates);
    const securityAlerts = Boolean(req.body?.security_alerts);
    const orderPlacement = Boolean(req.body?.order_placement);
    const pushNotifications = Boolean(req.body?.push_notifications);

    if (!fullName || !email) {
      return res.status(400).json({
        message: 'full_name and email are required.',
      });
    }

    if (avatarUrl.length > 5000000) {
      return res.status(400).json({
        message: 'avatar_url is too large. Please use a smaller image.',
      });
    }

    const columnMap = await getUsersColumnMap();
    const userId = await resolveTargetUserId(req, columnMap);
    if (!userId) {
      return res.status(404).json({
        message: 'No target user found to update profile.',
      });
    }

    const userUpdateClauses = [];
    const userUpdateParams = [];

    if (columnMap.fullNameColumn) {
      userUpdateClauses.push(`${columnMap.fullNameColumn} = ?`);
      userUpdateParams.push(fullName);
    }
    if (columnMap.roleColumn) {
      userUpdateClauses.push(`${columnMap.roleColumn} = ?`);
      userUpdateParams.push(role);
    }
    if (columnMap.emailColumn) {
      userUpdateClauses.push(`${columnMap.emailColumn} = ?`);
      userUpdateParams.push(email);
    }
    if (columnMap.avatarColumn) {
      userUpdateClauses.push(`${columnMap.avatarColumn} = ?`);
      userUpdateParams.push(avatarUrl || null);
    }

    if (!userUpdateClauses.length) {
      return res.status(500).json({
        message: 'No writable user columns found for profile sync.',
      });
    }

    await query(
      `UPDATE users
       SET ${userUpdateClauses.join(', ')}
       WHERE ${columnMap.idColumn} = ?`,
      [...userUpdateParams, userId],
    );

    const existingSettingsRows = await query(
      'SELECT id FROM admin_profile_settings WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [userId],
    );

    if (!existingSettingsRows.length) {
      await query(
        `INSERT INTO admin_profile_settings
        (user_id, full_name, role, email, avatar_url, system_updates, security_alerts, order_placement, push_notifications)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          fullName,
          role,
          email,
          avatarUrl,
          systemUpdates,
          securityAlerts,
          orderPlacement,
          pushNotifications,
        ],
      );
    } else {
      await query(
        `UPDATE admin_profile_settings
         SET full_name = ?, role = ?, email = ?, avatar_url = ?,
             system_updates = ?, security_alerts = ?, order_placement = ?, push_notifications = ?
         WHERE id = ?`,
        [
          fullName,
          role,
          email,
          avatarUrl,
          systemUpdates,
          securityAlerts,
          orderPlacement,
          pushNotifications,
          existingSettingsRows[0].id,
        ],
      );
    }

    const profile = await buildAdminProfile(userId, columnMap);
    if (!profile) {
      return res.status(404).json({
        message: 'Profile not found after update.',
      });
    }

    return res.json({
      message: 'Admin profile settings saved successfully.',
      profile,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
