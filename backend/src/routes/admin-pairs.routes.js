const express = require('express');
const { query } = require('../config/db');

const router = express.Router();

function toDisplayName(row) {
  return (
    row.pair_name ||
    row.pair_code ||
    `Pair ${row.id}`
  );
}

function toPairStatus(status, accessLevel) {
  const normalizedStatus = String(status || '').toUpperCase();
  const normalizedAccess = String(accessLevel || '').toUpperCase();

  if (normalizedAccess === 'REVOKED' || normalizedStatus === 'SUSPENDED' || normalizedStatus === 'UNPAIRED') {
    return 'Disabled';
  }
  if (normalizedStatus === 'CONNECTED' || normalizedStatus === 'SYNCING') {
    return 'Active';
  }
  return 'Pending';
}

function toFirmwareStatus(lastSeenAt) {
  if (!lastSeenAt) return 'Outdated';

  const seenTime = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(seenTime)) return 'Outdated';

  const daysSinceSeen = (Date.now() - seenTime) / (1000 * 60 * 60 * 24);
  return daysSinceSeen > 30 ? 'Outdated' : 'Updated';
}

function toTier(hasPremiumMember, memberCount, accountState) {
  if (accountState === 'Suspended') return 'Guest';
  if (hasPremiumMember) return 'Executive';
  if (memberCount >= 2) return 'Standard';
  return 'Guest';
}

function toPlatform(deviceLabel) {
  const source = String(deviceLabel || '').toLowerCase();
  if (source.includes('ios') || source.includes('iphone') || source.includes('ipad')) {
    return 'iOS';
  }
  if (source.includes('android')) {
    return 'Android';
  }
  return 'Unknown';
}

function toRelativeTime(input) {
  if (!input) return 'Never';

  const timestamp = new Date(input).getTime();
  if (!Number.isFinite(timestamp)) return 'Unknown';

  const deltaMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(deltaMs / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

function mapPairRow(row) {
  const accountState = Number(row.has_suspended_user) > 0 ? 'Suspended' : 'Active';
  const firmware = toFirmwareStatus(row.ring_last_seen_at);
  const status = toPairStatus(row.pair_status, row.access_level);
  const enabled = status !== 'Disabled';
  const os = row.device_label || 'No Device Data';
  const pairCode = row.pair_code || `PAIR-${row.id}`;
  const pairStatus = String(row.pair_status || 'PENDING').toUpperCase();
  const accessLevel = String(row.access_level || 'FULL_ACCESS').toUpperCase();
  const memberCount = Number(row.member_count || 0);

  return {
    id: Number(row.id),
    names: toDisplayName(row),
    pairCode,
    pairStatus,
    accessLevel,
    memberCount,
    deviceLabel: os,
    pairId: enabled ? row.pair_code : 'Access Revoked',
    tier: toTier(Number(row.has_premium_member) > 0, Number(row.member_count || 0), accountState),
    ring: row.ring_identifier || 'Unassigned',
    ringModel: row.ring_model || 'Unassigned',
    os,
    platform: toPlatform(os),
    status,
    firmware,
    accountState,
    lastActive: toRelativeTime(row.last_active_at),
    lastActiveAt: row.last_active_at || null,
    enabled,
    disabled: !enabled,
  };
}

async function loadPairRows() {
  return query(
    `
      SELECT
        rp.id,
        rp.pair_code,
        rp.status AS pair_status,
        rp.access_level,
        GROUP_CONCAT(
          DISTINCT COALESCE(
            NULLIF(u.full_name, ''),
            NULLIF(u.name, ''),
            NULLIF(u.username, ''),
            SUBSTRING_INDEX(u.email, '@', 1)
          )
          ORDER BY pm.member_role
          SEPARATOR ' & '
        ) AS pair_name,
        COUNT(DISTINCT pm.user_id) AS member_count,
        MAX(CASE WHEN COALESCE(u.account_status, 'ACTIVE') <> 'ACTIVE' THEN 1 ELSE 0 END) AS has_suspended_user,
        MAX(CASE WHEN COALESCE(s.plan_name, '') LIKE '%Premium%' THEN 1 ELSE 0 END) AS has_premium_member,
        GROUP_CONCAT(DISTINCT rg.ring_identifier ORDER BY rpl.side SEPARATOR ' / ') AS ring_identifier,
        SUBSTRING_INDEX(
          GROUP_CONCAT(
            DISTINCT COALESCE(rm.model_name, rg.ring_name)
            ORDER BY rpl.side
            SEPARATOR '||'
          ),
          '||',
          1
        ) AS ring_model,
        MAX(rg.last_seen_at) AS ring_last_seen_at,
        SUBSTRING_INDEX(
          GROUP_CONCAT(
            DISTINCT COALESCE(us.device_name, us.status_label, us.location_label)
            ORDER BY us.last_seen_at DESC
            SEPARATOR '||'
          ),
          '||',
          1
        ) AS device_label,
        MAX(COALESCE(us.last_seen_at, u.updated_at, rp.updated_at)) AS last_active_at
      FROM relationship_pairs rp
      LEFT JOIN pair_members pm ON pm.pair_id = rp.id
      LEFT JOIN users u ON u.id = pm.user_id
      LEFT JOIN subscriptions s ON s.user_id = u.id
      LEFT JOIN user_sessions us ON us.user_id = u.id AND us.revoked_at IS NULL
      LEFT JOIN ring_pair_links rpl ON rpl.pair_id = rp.id AND rpl.unassigned_at IS NULL
      LEFT JOIN rings rg ON rg.id = rpl.ring_id
      LEFT JOIN ring_models rm ON rm.id = rg.model_id
      GROUP BY rp.id, rp.pair_code, rp.status, rp.access_level
      ORDER BY last_active_at DESC, rp.updated_at DESC, rp.id DESC
    `,
  );
}

router.get('/', async (_req, res, next) => {
  try {
    const [rows, activeUserRows, disconnectedPairRows, outdatedFirmwareRows, suspendedAccountRows] = await Promise.all([
      loadPairRows(),
      query(
        `
          SELECT COUNT(DISTINCT u.id) AS total
          FROM users u
          INNER JOIN pair_members pm ON pm.user_id = u.id
          WHERE COALESCE(u.account_status, 'ACTIVE') = 'ACTIVE'
        `,
      ),
      query(
        `
          SELECT COUNT(*) AS total
          FROM relationship_pairs
          WHERE status NOT IN ('CONNECTED', 'SYNCING')
             OR access_level = 'REVOKED'
        `,
      ),
      query(
        `
          SELECT COUNT(DISTINCT rp.id) AS total
          FROM relationship_pairs rp
          LEFT JOIN ring_pair_links rpl ON rpl.pair_id = rp.id AND rpl.unassigned_at IS NULL
          LEFT JOIN rings rg ON rg.id = rpl.ring_id
          WHERE rg.id IS NULL
             OR rg.last_seen_at IS NULL
             OR rg.last_seen_at < (UTC_TIMESTAMP() - INTERVAL 30 DAY)
        `,
      ),
      query(
        `
          SELECT COUNT(DISTINCT u.id) AS total
          FROM users u
          INNER JOIN pair_members pm ON pm.user_id = u.id
          WHERE COALESCE(u.account_status, 'ACTIVE') <> 'ACTIVE'
        `,
      ),
    ]);
    const items = rows.map(mapPairRow);
    const totalPairs = Number(rows.length);
    const connectedPairs = items.filter(
      (item) => item.pairStatus === 'CONNECTED' || item.pairStatus === 'SYNCING'
    ).length;
    const revokedPairs = items.filter((item) => item.accessLevel === 'REVOKED').length;
    const pendingPairs = items.filter((item) => item.pairStatus === 'PENDING').length;

    res.json({
      summary: {
        totalPairs,
        connectedPairs,
        revokedPairs,
        pendingPairs,
        totalActiveUsers: Number(activeUserRows[0]?.total || 0),
        disconnectedPairs: Number(disconnectedPairRows[0]?.total || 0),
        outdatedFirmware: Number(outdatedFirmwareRows[0]?.total || 0),
        suspendedAccounts: Number(suspendedAccountRows[0]?.total || 0),
      },
      items,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/enabled', async (req, res, next) => {
  try {
    const pairId = Number(req.params.id);
    if (!Number.isInteger(pairId) || pairId <= 0) {
      return res.status(400).json({ message: 'Valid pair id is required.' });
    }

    const rows = await query(
      `
        SELECT id, status, access_level
        FROM relationship_pairs
        WHERE id = ?
        LIMIT 1
      `,
      [pairId],
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Pair not found.' });
    }

    const current = rows[0];
    const currentEnabled = toPairStatus(current.status, current.access_level) !== 'Disabled';
    const requestedEnabled =
      typeof req.body?.enabled === 'boolean' ? req.body.enabled : !currentEnabled;

    const nextStatus = requestedEnabled ? 'CONNECTED' : 'SUSPENDED';
    const nextAccessLevel = requestedEnabled ? 'FULL_ACCESS' : 'REVOKED';

    await query(
      `
        UPDATE relationship_pairs
        SET status = ?, access_level = ?
        WHERE id = ?
      `,
      [nextStatus, nextAccessLevel, pairId],
    );

    const updatedRows = await loadPairRows();
    const updated = updatedRows.find((row) => Number(row.id) === pairId);

    return res.json({
      item: updated ? mapPairRow(updated) : null,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const pairId = Number(req.params.id);
    if (!Number.isInteger(pairId) || pairId <= 0) {
      return res.status(400).json({ message: 'Valid pair id is required.' });
    }

    const result = await query('DELETE FROM relationship_pairs WHERE id = ?', [pairId]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Pair not found.' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
