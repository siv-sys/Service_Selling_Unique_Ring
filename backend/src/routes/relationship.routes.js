const express = require('express');
const { pool, query } = require('../config/db');

const router = express.Router();

function mapAccessLevelToPage(accessLevel) {
  return accessLevel === 'REVOKED' ? 'REVOKED' : 'GRANTED';
}

function mapAccessLevelFromPage(access) {
  return access === 'REVOKED' ? 'REVOKED' : 'FULL_ACCESS';
}

function mapVisibilityToPage(mode) {
  if (mode === 'PUBLIC') return 'public';
  if (mode === 'PRIVATE') return 'private';
  return 'partners';
}

function mapVisibilityFromPage(mode) {
  if (mode === 'public') return 'PUBLIC';
  if (mode === 'private') return 'PRIVATE';
  return 'PARTNERS_ONLY';
}

function mapStatusToPage(status, visibilityMode) {
  if (visibilityMode === 'PUBLIC') return 'PUBLIC';
  if (visibilityMode === 'PRIVATE') return 'PRIVATE';
  if (visibilityMode === 'PARTNERS_ONLY') return 'PARTNERS';
  if (status === 'CONNECTED') return 'PAIRED';
  return 'UNPAIRED';
}

function mapStatusFromPage(status) {
  return status === 'PAIRED' ? 'CONNECTED' : 'UNPAIRED';
}

async function loadRelationship(pairId) {
  const pairRows = await query(
    `
      SELECT
        rp.id,
        rp.pair_code,
        rp.status,
        rp.access_level,
        rp.established_at,
        pp.visibility_mode
      FROM relationship_pairs rp
      LEFT JOIN proximity_preferences pp ON pp.pair_id = rp.id
      WHERE rp.id = ?
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
        u.avatar_url
      FROM pair_members pm
      INNER JOIN users u ON u.id = pm.user_id
      WHERE pm.pair_id = ?
      ORDER BY FIELD(pm.member_role, 'OWNER', 'PARTNER'), u.id
    `,
    [pairId]
  );

  const ringRows = await query(
    `
      SELECT
        rpl.id AS link_id,
        r.id,
        r.ring_identifier
      FROM ring_pair_links rpl
      INNER JOIN rings r ON r.id = rpl.ring_id
      WHERE rpl.pair_id = ? AND rpl.unassigned_at IS NULL
      ORDER BY rpl.assigned_at ASC, r.id ASC
    `,
    [pairId]
  );

  const pair = pairRows[0];
  const visibilityMode = pair.visibility_mode || 'PARTNERS_ONLY';

  return {
    pairId: pair.id,
    pairCode: pair.pair_code,
    access: mapAccessLevelToPage(pair.access_level),
    status: mapStatusToPage(pair.status, visibilityMode),
    visibility: mapVisibilityToPage(visibilityMode),
    establishedAt: pair.established_at,
    members: memberRows.map((member) => ({
      id: member.id,
      role: member.member_role,
      fullName: member.full_name,
      username: member.username,
      avatarUrl: member.avatar_url,
    })),
    linkedRings: ringRows.map((ring) => ({
      id: ring.id,
      linkId: ring.link_id,
      ringIdentifier: ring.ring_identifier,
    })),
  };
}

router.get('/:pairId', async (req, res) => {
  try {
    const data = await loadRelationship(req.params.pairId);
    if (!data) {
      return res.status(404).json({ message: 'Relationship not found' });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:pairId', async (req, res) => {
  const { access, pairCode, status } = req.body;

  try {
    await query(
      `
        UPDATE relationship_pairs
        SET pair_code = ?, access_level = ?, status = ?
        WHERE id = ?
      `,
      [pairCode, mapAccessLevelFromPage(access), mapStatusFromPage(status), req.params.pairId]
    );

    const data = await loadRelationship(req.params.pairId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:pairId/privacy', async (req, res) => {
  const { visibility } = req.body;
  const updatedByUserId = req.header('x-auth-user-id') || null;

  try {
    await query(
      `
        INSERT INTO proximity_preferences (pair_id, visibility_mode, updated_by_user_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          visibility_mode = VALUES(visibility_mode),
          updated_by_user_id = VALUES(updated_by_user_id)
      `,
      [req.params.pairId, mapVisibilityFromPage(visibility), updatedByUserId]
    );

    const data = await loadRelationship(req.params.pairId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/:pairId/rings', async (req, res) => {
  const { ringIdentifier } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [ringRows] = await connection.execute(
      'SELECT id FROM rings WHERE ring_identifier = ? LIMIT 1',
      [ringIdentifier]
    );

    if (!ringRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Ring not found' });
    }

    const ringId = ringRows[0].id;

    const [existingRows] = await connection.execute(
      `
        SELECT id FROM ring_pair_links
        WHERE pair_id = ? AND ring_id = ? AND unassigned_at IS NULL
        LIMIT 1
      `,
      [req.params.pairId, ringId]
    );

    if (existingRows.length) {
      await connection.rollback();
      return res.status(409).json({ message: 'Ring already linked to this pair' });
    }

    const [activeRows] = await connection.execute(
      'SELECT COUNT(*) AS count FROM ring_pair_links WHERE pair_id = ? AND unassigned_at IS NULL',
      [req.params.pairId]
    );

    const side = Number(activeRows[0].count) % 2 === 0 ? 'A' : 'B';

    await connection.execute(
      'INSERT INTO ring_pair_links (pair_id, ring_id, side) VALUES (?, ?, ?)',
      [req.params.pairId, ringId, side]
    );

    await connection.commit();
    const data = await loadRelationship(req.params.pairId);
    return res.status(201).json(data);
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

router.delete('/:pairId/rings/:ringId', async (req, res) => {
  try {
    const result = await query(
      `
        UPDATE ring_pair_links
        SET unassigned_at = CURRENT_TIMESTAMP
        WHERE pair_id = ? AND ring_id = ? AND unassigned_at IS NULL
      `,
      [req.params.pairId, req.params.ringId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Linked ring not found' });
    }

    const data = await loadRelationship(req.params.pairId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
﻿
