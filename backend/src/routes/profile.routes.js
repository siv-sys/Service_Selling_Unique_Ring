const express = require('express');
const { execute, query } = require('../config/db');
const { persistAvatarUpload } = require('../utils/avatar');

const router = express.Router();

async function columnExists(tableName, columnName) {
  const rows = await query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
      LIMIT 1
    `,
    [tableName, columnName]
  );

  return rows.length > 0;
}

function buildDefaultProfile(user, relationship) {
  const title =
    user.full_name ||
    user.name ||
    user.username ||
    (String(user.email || '').includes('@') ? String(user.email).split('@')[0] : '') ||
    'Member';
  const defaultHandle =
    String(user.username || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || `member_${user.id}`;

  return {
    userId: Number(user.id),
    title,
    togetherSince: user.profile_headline || 'Your personal profile.',
    handle: defaultHandle,
    avatarUrl: user.avatar_url || null,
    linkedPartnerLabel: relationship?.partnerName ? `Linked to ${relationship.partnerName}` : 'No partner linked yet',
    phone: user.phone_number || '',
    verified: true,
    daysTogether: calculateDaysTogether(relationship?.establishedAt || null),
  };
}

function calculateDaysTogether(establishedAt) {
  if (!establishedAt) return 0;
  const start = new Date(`${establishedAt}T00:00:00Z`);
  const diff = Date.now() - start.getTime();
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}

async function loadRelationshipContext(userId) {
  const rows = await query(
    `
      SELECT
        rp.id AS pair_id,
        rp.established_at,
        COALESCE(
          NULLIF(partner.full_name, ''),
          NULLIF(partner.name, ''),
          NULLIF(partner.username, ''),
          SUBSTRING_INDEX(partner.email, '@', 1)
        ) AS partner_name
      FROM pair_members self_member
      INNER JOIN relationship_pairs rp ON rp.id = self_member.pair_id
      LEFT JOIN pair_members partner_member
        ON partner_member.pair_id = rp.id
        AND partner_member.user_id <> self_member.user_id
      LEFT JOIN users partner ON partner.id = partner_member.user_id
      WHERE self_member.user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  if (!rows.length) {
    return null;
  }

  return {
    pairId: Number(rows[0].pair_id),
    establishedAt: rows[0].established_at || null,
    partnerName: rows[0].partner_name || '',
  };
}

async function loadProfile(userId) {
  const hasPhoneNumber = await columnExists('users', 'phone_number');
  const hasProfileHeadline = await columnExists('users', 'profile_headline');

  const rows = await query(
    `
      SELECT
        id,
        email,
        username,
        COALESCE(NULLIF(full_name, ''), NULLIF(name, ''), NULLIF(username, ''), SUBSTRING_INDEX(email, '@', 1)) AS full_name,
        name,
        avatar_url,
        ${hasPhoneNumber ? 'phone_number' : 'NULL AS phone_number'},
        ${hasProfileHeadline ? 'profile_headline' : 'NULL AS profile_headline'}
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [userId]
  );
  if (!rows.length) return null;

  const relationship = await loadRelationshipContext(userId);
  return buildDefaultProfile(rows[0], relationship);
}

async function saveProfile(userId, payload) {
  const { title, togetherSince, handle, avatarUrl, phone } = payload;
  const hasPhoneNumber = await columnExists('users', 'phone_number');
  const hasProfileHeadline = await columnExists('users', 'profile_headline');
  const persistedAvatarUrl = await persistAvatarUpload(`user-${userId}`, avatarUrl);

  const updates = [
    'full_name = ?',
    'name = ?',
    'username = ?',
    'avatar_url = ?',
  ];
  const values = [
    String(title || '').trim() || null,
    String(title || '').trim() || null,
    String(handle || '').trim() || null,
    persistedAvatarUrl || null,
  ];

  if (hasPhoneNumber) {
    updates.push('phone_number = ?');
    values.push(String(phone || '').trim() || null);
  }

  if (hasProfileHeadline) {
    updates.push('profile_headline = ?');
    values.push(String(togetherSince || '').trim() || null);
  }

  values.push(userId);

  await execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

  return loadProfile(userId);
}

router.get('/me/current', async (req, res) => {
  try {
    const userId = Number(req.auth?.user?.id);
    const data = await loadProfile(userId);
    if (!data) return res.status(404).json({ message: 'Profile not found' });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/me/current', async (req, res) => {
  try {
    const userId = Number(req.auth?.user?.id);
    const data = await saveProfile(userId, req.body);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
