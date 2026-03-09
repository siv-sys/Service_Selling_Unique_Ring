const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { query } = require('../config/db');

const router = express.Router();

async function tableExists(tableName) {
  const rows = await query(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ?
      LIMIT 1
    `,
    [tableName]
  );

  return rows.length > 0;
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

async function resolvePairId(req) {
  const userId = Number(req.header('x-auth-user-id'));
  if (Number.isFinite(userId) && userId > 0) {
    const rows = await query(
      `
        SELECT pair_id
        FROM pair_members
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    if (rows.length) {
      return Number(rows[0].pair_id);
    }
  }

  return null;
}

function buildDefaultProfile(pairId, members) {
  const owner = members.find((member) => member.member_role === 'OWNER');
  const partner = members.find((member) => member.member_role === 'PARTNER');
  const title = [owner?.full_name, partner?.full_name].filter(Boolean).join(' & ') || 'Couple Profile';

  return {
    pairId,
    title,
    headline: 'Together, every day.',
    handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `pair_${pairId}`,
    heroAvatarUrl: owner?.avatar_url || partner?.avatar_url || null,
    linkedPartnerLabel: partner?.full_name ? `Linked to ${partner.full_name}` : 'Relationship linked',
    phone: owner?.phone_number || '',
    verified: true,
    daysTogether: 0,
  };
}

function calculateDaysTogether(establishedAt) {
  if (!establishedAt) return 0;
  const start = new Date(`${establishedAt}T00:00:00Z`);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}

async function loadProfile(pairId) {
  const hasCoupleProfiles = await tableExists('couple_profiles');
  const hasPhoneNumber = await columnExists('users', 'phone_number');

  const pairRows = await query(
    `
      SELECT id, established_at
      FROM relationship_pairs
      WHERE id = ?
      LIMIT 1
    `,
    [pairId]
  );

  if (!pairRows.length) {
    return null;
  }

  const memberRows = await query(
    `
      SELECT
        pm.member_role,
        u.id,
        u.full_name,
        u.username,
        u.avatar_url,
        ${hasPhoneNumber ? 'u.phone_number' : "NULL AS phone_number"}
      FROM pair_members pm
      INNER JOIN users u ON u.id = pm.user_id
      WHERE pm.pair_id = ?
      ORDER BY FIELD(pm.member_role, 'OWNER', 'PARTNER'), u.id
    `,
    [pairId]
  );

  const profileRows = hasCoupleProfiles
    ? await query(
        `
          SELECT pair_id, title, slug, headline, hero_avatar_url, linked_partner_label
          FROM couple_profiles
          WHERE pair_id = ?
          LIMIT 1
        `,
        [pairId]
      )
    : [];

  const pair = pairRows[0];
  const stored = profileRows[0];
  const fallback = buildDefaultProfile(pairId, memberRows);

  return {
    pairId,
    title: stored?.title || fallback.title,
    togetherSince: stored?.headline || fallback.headline,
    handle: stored?.slug || fallback.handle,
    avatarUrl: stored?.hero_avatar_url || fallback.heroAvatarUrl,
    linkedPartnerLabel: stored?.linked_partner_label || fallback.linkedPartnerLabel,
    phone: fallback.phone,
    verified: true,
    daysTogether: calculateDaysTogether(pair.established_at),
  };
}

async function saveProfile(pairId, payload) {
  const { title, togetherSince, handle, avatarUrl, phone } = payload;
  const hasCoupleProfiles = await tableExists('couple_profiles');
  const hasPhoneNumber = await columnExists('users', 'phone_number');
  const persistedAvatarUrl = await persistAvatar(pairId, avatarUrl);

  if (hasCoupleProfiles) {
    await query(
      `
        INSERT INTO couple_profiles (pair_id, title, slug, headline, hero_avatar_url)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          slug = VALUES(slug),
          headline = VALUES(headline),
          hero_avatar_url = VALUES(hero_avatar_url)
      `,
      [pairId, title, handle, togetherSince, persistedAvatarUrl || null]
    );
  }

  const ownerRows = await query(
    `
      SELECT user_id
      FROM pair_members
      WHERE pair_id = ? AND member_role = 'OWNER'
      LIMIT 1
    `,
    [pairId]
  );

  if (hasPhoneNumber && ownerRows.length) {
    await query('UPDATE users SET phone_number = ? WHERE id = ?', [phone || null, ownerRows[0].user_id]);
  }

  return loadProfile(pairId);
}

async function persistAvatar(pairId, avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return null;
  }

  if (!avatarUrl.startsWith('data:image/')) {
    return avatarUrl;
  }

  const match = avatarUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Unsupported image format');
  }

  const extension = match[1] === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Image is too large. Please use a file under 5MB.');
  }

  const uploadsDir = path.resolve(__dirname, '../../uploads/profile');
  await fs.mkdir(uploadsDir, { recursive: true });

  const fileName = `pair-${pairId}-${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  await fs.writeFile(filePath, buffer);

  return `/uploads/profile/${fileName}`;
}

router.get('/me/current', async (req, res) => {
  try {
    const pairId = await resolvePairId(req);
    if (!pairId) {
      return res.status(404).json({ message: 'No relationship pair found for this user' });
    }

    const data = await loadProfile(pairId);
    if (!data) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/me/current', async (req, res) => {
  try {
    const pairId = await resolvePairId(req);
    if (!pairId) {
      return res.status(404).json({ message: 'No relationship pair found for this user' });
    }

    const data = await saveProfile(pairId, req.body);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:pairId', async (req, res) => {
  try {
    const data = await loadProfile(Number(req.params.pairId));
    if (!data) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:pairId', async (req, res) => {
  const pairId = Number(req.params.pairId);

  try {
    const data = await saveProfile(pairId, req.body);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
