const express = require('express');
const { query } = require('../config/db');

const router = express.Router();

function mapRole(code) {
  if (code === 'admin') return 'Admin';
  return 'User';
}

function mapUserStatus(status) {
  if (status === 'SUSPENDED' || status === 'suspended') return 'Suspended';
  return 'Active';
}

function mapPairStage(status) {
  if (status === 'CONNECTED') return 'Active';
  if (status === 'SYNCING') return 'Anniversary';
  if (status === 'PENDING') return 'New';
  if (status === 'SUSPENDED' || status === 'UNPAIRED') return 'Paused';
  return 'New';
}

function mapRingStatus(status) {
  if (status === 'ASSIGNED') return 'Sold';
  if (status === 'AVAILABLE' || status === 'RESERVED') return 'Pending Payment';
  return 'Refunded';
}

function extractNumericId(rawId) {
  const matched = String(rawId || '').match(/(\d+)/);
  if (!matched) return null;
  return Number(matched[1]);
}

function nextFromCycle(current, order) {
  const idx = order.indexOf(current);
  if (idx === -1) return order[0];
  return order[(idx + 1) % order.length];
}

async function loadUserViewById(userId) {
  const rows = await query(
    `
      SELECT
        u.id,
        COALESCE(u.name, '') AS name,
        u.email,
        u.updated_at,
        COALESCE(u.role, 'user') AS role_code,
        COALESCE(u.account_status, 'ACTIVE') AS account_status
      FROM users u
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: `usr-${row.id}`,
    name: row.name,
    email: row.email,
    role: mapRole(row.role_code),
    status: mapUserStatus(row.account_status),
    lastActive: new Date(row.updated_at).toLocaleString(),
  };
}

async function loadRingViewById(ringId) {
  const rows = await query(
    `
      SELECT
        rg.id,
        rg.ring_identifier,
        rg.ring_name,
        rg.status,
        rg.updated_at,
        COALESCE(rm.model_name, rg.ring_name) AS model_name
      FROM rings rg
      LEFT JOIN ring_models rm ON rm.id = rg.model_id
      WHERE rg.id = ?
      LIMIT 1
    `,
    [ringId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: `sale-${row.id}`,
    orderNo: `#${row.ring_identifier}`,
    customer: row.ring_name,
    model: row.model_name,
    status: mapRingStatus(row.status),
    soldAt: new Date(row.updated_at).toLocaleString(),
  };
}

async function loadRelationshipViewById(pairId) {
  const rows = await query(
    `
      SELECT
        rp.id,
        rp.status,
        rp.updated_at,
        GROUP_CONCAT(COALESCE(u.name, u.email, CONCAT('User ', u.id)) ORDER BY pm.member_role SEPARATOR ' & ') AS pair_name
      FROM relationship_pairs rp
      LEFT JOIN pair_members pm ON pm.pair_id = rp.id
      LEFT JOIN users u ON u.id = pm.user_id
      WHERE rp.id = ?
      GROUP BY rp.id, rp.status, rp.updated_at
      LIMIT 1
    `,
    [pairId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: `rel-${row.id}`,
    pair: row.pair_name || `Pair ${row.id}`,
    stage: mapPairStage(row.status),
    lastInteraction: new Date(row.updated_at).toLocaleString(),
    reminderAt: 'N/A',
  };
}

async function loadWeeklyConnectivity() {
  const rows = await query(
    `
      SELECT DATE(activity_at) AS activity_date, COUNT(*) AS total
      FROM (
        SELECT updated_at AS activity_at
        FROM users
        WHERE updated_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)

        UNION ALL

        SELECT updated_at AS activity_at
        FROM rings
        WHERE updated_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)

        UNION ALL

        SELECT updated_at AS activity_at
        FROM relationship_pairs
        WHERE updated_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)

        UNION ALL

        SELECT created_at AS activity_at
        FROM pair_invitations
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      ) activity_log
      GROUP BY DATE(activity_at)
      ORDER BY activity_date ASC
    `
  ).catch(() => []);

  const totalsByDate = new Map(
    rows.map((row) => {
      const key =
        row.activity_date instanceof Date
          ? row.activity_date.toISOString().slice(0, 10)
          : String(row.activity_date).slice(0, 10);
      return [key, Number(row.total || 0)];
    })
  );

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const key = date.toISOString().slice(0, 10);
    const label = date
      .toLocaleDateString('en-US', { weekday: 'short' })
      .toUpperCase();

    return {
      name: label,
      value: totalsByDate.get(key) || 0,
    };
  });
}

router.get('/', async (_req, res) => {
  try {
    const [userCountRows, ringSoldRows, activePairsRows] = await Promise.all([
      query('SELECT COUNT(*) AS total FROM users'),
      query("SELECT COUNT(*) AS total FROM rings WHERE status = 'ASSIGNED'"),
      query("SELECT COUNT(*) AS total FROM relationship_pairs WHERE status IN ('CONNECTED', 'SYNCING')"),
    ]);

    const [usersRows, ringSalesRows, pairRows, invitationRows] = await Promise.all([
      query(`
        SELECT
          u.id,
          COALESCE(u.name, '') AS name,
          u.email,
          u.updated_at,
          COALESCE(u.role, 'user') AS role_code,
          COALESCE(u.account_status, 'ACTIVE') AS account_status
        FROM users u
        ORDER BY u.updated_at DESC
        LIMIT 10
      `),
      query(`
        SELECT
          rg.id,
          rg.ring_identifier,
          rg.ring_name,
          rg.status,
          rg.updated_at,
          COALESCE(rm.model_name, rg.ring_name) AS model_name
        FROM rings rg
        LEFT JOIN ring_models rm ON rm.id = rg.model_id
        ORDER BY rg.updated_at DESC
        LIMIT 10
      `),
      query(`
        SELECT
          rp.id,
          rp.status,
          rp.updated_at,
          GROUP_CONCAT(COALESCE(u.name, u.email, CONCAT('User ', u.id)) ORDER BY pm.member_role SEPARATOR ' & ') AS pair_name
        FROM relationship_pairs rp
        LEFT JOIN pair_members pm ON pm.pair_id = rp.id
        LEFT JOIN users u ON u.id = pm.user_id
        GROUP BY rp.id, rp.status, rp.updated_at
        ORDER BY rp.updated_at DESC
        LIMIT 10
      `),
      query(`
        SELECT
          pi.id,
          pi.status,
          pi.created_at,
          COALESCE(inviter.name, inviter.email, 'Unknown') AS inviter_name,
          COALESCE(invitee.name, invitee.email, pi.invitee_handle, 'Pending User') AS invitee_name,
          COALESCE(rm.model_name, 'SmartRing') AS model_name
        FROM pair_invitations pi
        LEFT JOIN users inviter ON inviter.id = pi.inviter_user_id
        LEFT JOIN users invitee ON invitee.id = pi.invitee_user_id
        LEFT JOIN relationship_pairs rp ON rp.id = pi.pair_id
        LEFT JOIN ring_pair_links rpl ON rpl.pair_id = rp.id AND rpl.unassigned_at IS NULL
        LEFT JOIN rings rg ON rg.id = rpl.ring_id
        LEFT JOIN ring_models rm ON rm.id = rg.model_id
        ORDER BY pi.created_at DESC
        LIMIT 10
      `),
    ]);

    const totalUsers = Number(userCountRows[0]?.total || 0);
    const totalRingsSold = Number(ringSoldRows[0]?.total || 0);
    const activeRelationships = Number(activePairsRows[0]?.total || 0);

    const systemUsers = usersRows.map((row) => ({
      id: `usr-${row.id}`,
      name: row.name,
      email: row.email,
      role: mapRole(row.role_code),
      status: mapUserStatus(row.account_status),
      lastActive: new Date(row.updated_at).toLocaleString(),
    }));

    const ringSales = ringSalesRows.map((row) => ({
      id: `sale-${row.id}`,
      orderNo: `#${row.ring_identifier}`,
      customer: row.ring_name,
      model: row.model_name,
      status: mapRingStatus(row.status),
      soldAt: new Date(row.updated_at).toLocaleString(),
    }));

    const relationshipFollows = pairRows.map((row) => ({
      id: `rel-${row.id}`,
      pair: row.pair_name || `Pair ${row.id}`,
      stage: mapPairStage(row.status),
      lastInteraction: new Date(row.updated_at).toLocaleString(),
      reminderAt: 'N/A',
    }));

    const pairingRequests = invitationRows.map((row) => ({
      users: [row.inviter_name, row.invitee_name],
      model: row.model_name,
      date: new Date(row.created_at).toLocaleString(),
      status: row.status === 'ACCEPTED' ? 'Approved' : 'Pending',
    }));

    const relationshipUserAlerts = [
      {
        id: 'db-users',
        title: 'Users Synced From DB',
        description: `${totalUsers} user account(s) loaded from MySQL.`,
        time: 'just now',
        type: 'active',
      },
      {
        id: 'db-rings',
        title: 'Ring Inventory Synced',
        description: `${totalRingsSold} assigned ring(s) counted as sold.`,
        time: 'just now',
        type: 'returning',
      },
      {
        id: 'db-pairs',
        title: 'Relationship Status Synced',
        description: `${activeRelationships} active relationship pair(s) found.`,
        time: 'just now',
        type: 'anniversary',
      },
    ];

    const weeklyConnectivity = await loadWeeklyConnectivity();

    res.json({
      stats: {
        totalUsers,
        totalRingsSold,
        activeRelationships,
        usersChange: '+12%',
        ringsSoldChange: '+5%',
        relationshipsChange: '+2%',
        connectivityPercent: 94,
        connectivityChange: '+1.2%',
      },
      systemUsers,
      ringSales,
      relationshipFollows,
      pairingRequests,
      relationshipUserAlerts,
      weeklyConnectivity,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to load dashboard from database',
      error: error.message,
    });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const userId = extractNumericId(req.params.id);
    if (!userId) return res.status(400).json({ message: 'Invalid user id' });

    const rows = await query('SELECT id, COALESCE(account_status, ?) AS account_status FROM users WHERE id = ? LIMIT 1', [
      'ACTIVE',
      userId,
    ]);
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });

    const nextStatus = String(rows[0].account_status).toUpperCase() === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await query('UPDATE users SET account_status = ? WHERE id = ?', [nextStatus, userId]);

    const user = await loadUserViewById(userId);
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const userId = extractNumericId(req.params.id);
    if (!userId) return res.status(400).json({ message: 'Invalid user id' });

    const roleRows = await query(
      'SELECT COALESCE(role, ? ) AS role_code FROM users WHERE id = ? LIMIT 1',
      ['user', userId]
    );
    if (!roleRows[0]) return res.status(404).json({ message: 'User not found' });

    const nextRole = nextFromCycle(roleRows[0].role_code, ['user', 'admin']);
    await query('UPDATE users SET role = ? WHERE id = ?', [nextRole, userId]);

    const user = await loadUserViewById(userId);
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
});

router.patch('/rings/:id/status', async (req, res) => {
  try {
    const ringId = extractNumericId(req.params.id);
    if (!ringId) return res.status(400).json({ message: 'Invalid ring id' });

    const rows = await query('SELECT status FROM rings WHERE id = ? LIMIT 1', [ringId]);
    if (!rows[0]) return res.status(404).json({ message: 'Ring not found' });

    const next = nextFromCycle(rows[0].status, ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE']);
    await query('UPDATE rings SET status = ? WHERE id = ?', [next, ringId]);

    const ring = await loadRingViewById(ringId);
    return res.json({ ring });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update ring status', error: error.message });
  }
});

router.patch('/relationships/:id/stage', async (req, res) => {
  try {
    const pairId = extractNumericId(req.params.id);
    if (!pairId) return res.status(400).json({ message: 'Invalid relationship id' });

    const rows = await query('SELECT status FROM relationship_pairs WHERE id = ? LIMIT 1', [pairId]);
    if (!rows[0]) return res.status(404).json({ message: 'Relationship not found' });

    const next = nextFromCycle(rows[0].status, ['PENDING', 'CONNECTED', 'SYNCING', 'SUSPENDED']);
    await query('UPDATE relationship_pairs SET status = ? WHERE id = ?', [next, pairId]);

    const relationship = await loadRelationshipViewById(pairId);
    return res.json({ relationship });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update relationship stage', error: error.message });
  }
});

module.exports = router;
