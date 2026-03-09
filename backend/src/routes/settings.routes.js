const express = require('express');
const { query } = require('../config/db');

const router = express.Router();

function resolveUserId(req) {
  const requestedUserId = Number(req.header('x-auth-user-id'));
  return Number.isFinite(requestedUserId) && requestedUserId > 0 ? requestedUserId : 1;
}

function getDefaultSubscription() {
  return {
    planName: 'Premium Plan',
    autoRenewEnabled: true,
    renewingOn: '2026-12-12T00:00:00.000Z',
  };
}

function mapSettingsRow(row) {
  return {
    twoFactorEnabled: Boolean(row.two_factor_enabled),
    privacyLevel: row.privacy_level,
    themeMode: row.theme_mode,
    anniversaryReminders: Boolean(row.anniversary_reminders),
    systemUpdates: Boolean(row.system_updates),
    autoSync: Boolean(row.auto_sync),
    language: row.language,
    globalMute: Boolean(row.global_mute),
    dndEnabled: Boolean(row.dnd_enabled),
    dndFromTime: row.dnd_from_time ? String(row.dnd_from_time).slice(0, 5) : '22:00',
    dndUntilTime: row.dnd_until_time ? String(row.dnd_until_time).slice(0, 5) : '07:00',
    repeatDaily: Boolean(row.repeat_daily),
    soundPrefs: {
      anniversary: row.anniversary_sound,
      reminders: row.reminders_sound,
      messages: row.messages_sound,
    },
    emailPrefs: {
      weeklyWrap: Boolean(row.email_weekly_wrap),
      productTips: Boolean(row.email_product_tips),
      occasionReminders: Boolean(row.email_occasion_reminders),
      partnerAlerts: Boolean(row.email_partner_alerts),
    },
    lastExportAt: row.last_export_at,
    lastSyncedAt: row.last_synced_at,
  };
}

function mapSubscriptionRow(row) {
  if (!row) return getDefaultSubscription();
  return {
    planName: row.plan_name,
    autoRenewEnabled: Boolean(row.auto_renew_enabled),
    renewingOn: row.renewing_on,
  };
}

function mapSessionRow(row) {
  return {
    id: row.id,
    name: row.device_name,
    location: row.location_label || 'Unknown location',
    status: row.status_label || 'Last active recently',
    badge: row.badge || '',
    icon: row.icon || '💻',
  };
}

async function ensureSettingsRow(userId) {
  await query(
    `
      INSERT INTO user_settings (user_id)
      VALUES (?)
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
    `,
    [userId]
  );
}

async function ensureSubscriptionRow(userId) {
  await query(
    `
      INSERT INTO subscriptions (user_id, plan_name, auto_renew_enabled, renewing_on)
      VALUES (?, 'Premium Plan', 1, '2026-12-12 00:00:00')
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
    `,
    [userId]
  );
}

async function loadSettingsBundle(userId) {
  await ensureSettingsRow(userId);
  await ensureSubscriptionRow(userId);

  const settingsRows = await query(
    `
      SELECT *
      FROM user_settings
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  const subscriptionRows = await query(
    `
      SELECT plan_name, auto_renew_enabled, renewing_on
      FROM subscriptions
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  const sessionRows = await query(
    `
      SELECT id, device_name, location_label, status_label, badge, icon
      FROM user_sessions
      WHERE user_id = ? AND revoked_at IS NULL
      ORDER BY created_at DESC, id DESC
    `,
    [userId]
  );

  return {
    ...mapSettingsRow(settingsRows[0]),
    subscription: mapSubscriptionRow(subscriptionRows[0]),
    activeSessions: sessionRows.map(mapSessionRow),
  };
}

router.get('/me', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const data = await loadSettingsBundle(userId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put('/me', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const {
      twoFactorEnabled,
      privacyLevel,
      themeMode,
      anniversaryReminders,
      systemUpdates,
      autoSync,
      language,
      globalMute,
      dndEnabled,
      dndFromTime,
      dndUntilTime,
      repeatDaily,
      soundPrefs,
      emailPrefs,
    } = req.body;

    await query(
      `
        INSERT INTO user_settings (
          user_id,
          two_factor_enabled,
          privacy_level,
          theme_mode,
          anniversary_reminders,
          system_updates,
          auto_sync,
          language,
          global_mute,
          dnd_enabled,
          dnd_from_time,
          dnd_until_time,
          repeat_daily,
          anniversary_sound,
          reminders_sound,
          messages_sound,
          email_weekly_wrap,
          email_product_tips,
          email_occasion_reminders,
          email_partner_alerts,
          last_synced_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          two_factor_enabled = VALUES(two_factor_enabled),
          privacy_level = VALUES(privacy_level),
          theme_mode = VALUES(theme_mode),
          anniversary_reminders = VALUES(anniversary_reminders),
          system_updates = VALUES(system_updates),
          auto_sync = VALUES(auto_sync),
          language = VALUES(language),
          global_mute = VALUES(global_mute),
          dnd_enabled = VALUES(dnd_enabled),
          dnd_from_time = VALUES(dnd_from_time),
          dnd_until_time = VALUES(dnd_until_time),
          repeat_daily = VALUES(repeat_daily),
          anniversary_sound = VALUES(anniversary_sound),
          reminders_sound = VALUES(reminders_sound),
          messages_sound = VALUES(messages_sound),
          email_weekly_wrap = VALUES(email_weekly_wrap),
          email_product_tips = VALUES(email_product_tips),
          email_occasion_reminders = VALUES(email_occasion_reminders),
          email_partner_alerts = VALUES(email_partner_alerts),
          last_synced_at = VALUES(last_synced_at)
      `,
      [
        userId,
        twoFactorEnabled ? 1 : 0,
        privacyLevel || 'Contacts',
        themeMode || 'Light',
        anniversaryReminders ? 1 : 0,
        systemUpdates ? 1 : 0,
        autoSync ? 1 : 0,
        language || 'English (US)',
        globalMute ? 1 : 0,
        dndEnabled ? 1 : 0,
        dndFromTime ? `${dndFromTime}:00` : null,
        dndUntilTime ? `${dndUntilTime}:00` : null,
        repeatDaily ? 1 : 0,
        soundPrefs?.anniversary || 'Bell Chime',
        soundPrefs?.reminders || 'Soft Hum',
        soundPrefs?.messages || 'Digital Pop',
        emailPrefs?.weeklyWrap ? 1 : 0,
        emailPrefs?.productTips ? 1 : 0,
        emailPrefs?.occasionReminders ? 1 : 0,
        emailPrefs?.partnerAlerts ? 1 : 0,
      ]
    );

    const data = await loadSettingsBundle(userId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete('/me', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    await ensureSettingsRow(userId);
    await query(
      `
        UPDATE user_settings
        SET
          two_factor_enabled = 0,
          privacy_level = 'Contacts',
          theme_mode = 'Light',
          anniversary_reminders = 1,
          system_updates = 0,
          auto_sync = 1,
          language = 'English (US)',
          global_mute = 0,
          dnd_enabled = 1,
          dnd_from_time = '22:00:00',
          dnd_until_time = '07:00:00',
          repeat_daily = 1,
          anniversary_sound = 'Bell Chime',
          reminders_sound = 'Soft Hum',
          messages_sound = 'Digital Pop',
          email_weekly_wrap = 1,
          email_product_tips = 0,
          email_occasion_reminders = 1,
          email_partner_alerts = 1,
          last_export_at = NULL,
          last_synced_at = NULL
        WHERE user_id = ?
      `,
      [userId]
    );

    const data = await loadSettingsBundle(userId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/me/export', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    await ensureSettingsRow(userId);
    await query(
      `
        UPDATE user_settings
        SET last_export_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `,
      [userId]
    );

    const data = await loadSettingsBundle(userId);
    return res.json({ lastExportAt: data.lastExportAt });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/me/subscription', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { autoRenewEnabled } = req.body;
    await ensureSubscriptionRow(userId);
    await query(
      `
        UPDATE subscriptions
        SET
          auto_renew_enabled = ?,
          renewing_on = CASE
            WHEN ? = 1 THEN '2026-12-12 00:00:00'
            ELSE NULL
          END
        WHERE user_id = ?
      `,
      [autoRenewEnabled ? 1 : 0, autoRenewEnabled ? 1 : 0, userId]
    );

    const data = await loadSettingsBundle(userId);
    return res.json(data.subscription);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete('/me/sessions/:sessionId', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    await query(
      `
        UPDATE user_sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ? AND revoked_at IS NULL
      `,
      [req.params.sessionId, userId]
    );

    const data = await loadSettingsBundle(userId);
    return res.json({ activeSessions: data.activeSessions });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/me/sessions/logout-all', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    await query(
      `
        UPDATE user_sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND revoked_at IS NULL
      `,
      [userId]
    );

    return res.json({ success: true, activeSessions: [] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete('/me/account', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    await query(
      `
        UPDATE users
        SET account_status = 'DELETED'
        WHERE id = ?
      `,
      [userId]
    );
    await query(
      `
        UPDATE user_sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND revoked_at IS NULL
      `,
      [userId]
    );

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
