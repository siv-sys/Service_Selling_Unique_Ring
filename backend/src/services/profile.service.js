const { execute, query } = require('../config/db');
const { persistAvatarUpload } = require('../utils/avatar');

const PROFILE_HANDLE_MIN_LENGTH = 3;
const PROFILE_HANDLE_MAX_LENGTH = 30;
const RESERVED_PROFILE_HANDLES = new Set([
  'admin',
  'api',
  'auth',
  'cart',
  'dashboard',
  'login',
  'logout',
  'memories',
  'profile',
  'register',
  'relationship',
  'reset-password',
  'settings',
  'shop',
  'u',
]);

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

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

function sanitizeProfileHandle(value, fallback = '') {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/[_-]{2,}/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '');

  return normalized || String(fallback || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/[_-]{2,}/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '');
}

function assertValidProfileHandle(handle) {
  if (!handle) {
    throw createHttpError(400, 'Profile handle is required.');
  }

  if (handle.length < PROFILE_HANDLE_MIN_LENGTH || handle.length > PROFILE_HANDLE_MAX_LENGTH) {
    throw createHttpError(
      400,
      `Profile handle must be ${PROFILE_HANDLE_MIN_LENGTH}-${PROFILE_HANDLE_MAX_LENGTH} characters long.`
    );
  }

  if (!/^[a-z0-9_-]+$/.test(handle)) {
    throw createHttpError(400, 'Profile handle can only include letters, numbers, hyphens, and underscores.');
  }

  if (RESERVED_PROFILE_HANDLES.has(handle)) {
    throw createHttpError(400, 'That profile handle is reserved. Please choose another one.');
  }
}

function getDefaultTitle(user) {
  return (
    user.full_name ||
    user.name ||
    user.username ||
    (String(user.email || '').includes('@') ? String(user.email).split('@')[0] : '') ||
    'Member'
  );
}

function getDefaultHandle(user) {
  return (
    sanitizeProfileHandle(
      user.username || (String(user.email || '').includes('@') ? String(user.email).split('@')[0] : ''),
      `member_${user.id}`
    ) || `member_${user.id}`
  );
}

function buildDefaultProfile(user, relationship) {
  const title = getDefaultTitle(user);

  return {
    userId: Number(user.id),
    title,
    togetherSince: user.profile_headline || 'Your personal profile.',
    handle: getDefaultHandle(user),
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

async function loadUserRow(whereClause, params) {
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
      WHERE ${whereClause}
      LIMIT 1
    `,
    params
  );

  return rows[0] || null;
}

async function findUserByNormalizedHandle(handle, excludeUserId = null) {
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
      WHERE (? IS NULL OR id <> ?)
    `,
    [excludeUserId, excludeUserId]
  );

  return rows.find((row) => getDefaultHandle(row) === handle) || null;
}

async function loadProfile(userId) {
  const user = await loadUserRow('id = ?', [userId]);
  if (!user) return null;

  const relationship = await loadRelationshipContext(userId);
  return buildDefaultProfile(user, relationship);
}

async function loadPublicProfileByHandle(handle) {
  const normalizedHandle = sanitizeProfileHandle(handle);
  assertValidProfileHandle(normalizedHandle);

  const user =
    (await loadUserRow('LOWER(username) = ?', [normalizedHandle])) ||
    (await findUserByNormalizedHandle(normalizedHandle));
  if (!user) {
    return null;
  }

  const relationship = await loadRelationshipContext(user.id);
  const profile = buildDefaultProfile(user, relationship);

  return {
    title: profile.title,
    togetherSince: profile.togetherSince,
    handle: profile.handle,
    avatarUrl: profile.avatarUrl,
    linkedPartnerLabel: profile.linkedPartnerLabel,
    daysTogether: profile.daysTogether,
  };
}

async function ensureUniqueHandle(userId, handle) {
  const existingUser =
    (await loadUserRow('LOWER(username) = ? AND id <> ?', [handle, userId])) ||
    (await findUserByNormalizedHandle(handle, userId));

  if (existingUser) {
    throw createHttpError(409, 'This profile handle is already taken.');
  }
}

async function saveProfile(userId, payload) {
  const { title, togetherSince, handle, avatarUrl, phone } = payload || {};
  const hasPhoneNumber = await columnExists('users', 'phone_number');
  const hasProfileHeadline = await columnExists('users', 'profile_headline');
  const persistedAvatarUrl = await persistAvatarUpload(`user-${userId}`, avatarUrl);
  const normalizedHandle = sanitizeProfileHandle(handle, `member_${userId}`);

  assertValidProfileHandle(normalizedHandle);
  await ensureUniqueHandle(userId, normalizedHandle);

  const updates = [
    'full_name = ?',
    'name = ?',
    'username = ?',
    'avatar_url = ?',
  ];
  const values = [
    String(title || '').trim() || null,
    String(title || '').trim() || null,
    normalizedHandle,
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

module.exports = {
  loadProfile,
  loadPublicProfileByHandle,
  saveProfile,
  sanitizeProfileHandle,
};
