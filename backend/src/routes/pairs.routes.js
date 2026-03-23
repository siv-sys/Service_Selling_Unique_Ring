const express = require('express');
const { pool, query } = require('../config/db');

const router = express.Router();

function getCurrentUserId(req) {
  const authUserId = Number(req.auth?.user?.id);
  if (Number.isInteger(authUserId) && authUserId > 0) {
    return authUserId;
  }

  const headerUserId = Number(req.header('x-auth-user-id'));
  if (Number.isInteger(headerUserId) && headerUserId > 0) {
    return headerUserId;
  }

  return 0;
}

// Get my connection details
router.get('/my-connection', async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);

    // Find active relationship pair for current user
    const pairs = await query(
      `SELECT 
         rp.id as pair_id,
         rp.pair_code,
         rp.status,
         rp.access_level,
         rp.established_at,
         pm.member_role,
         u.id as partner_id,
         u.email as partner_email,
         COALESCE(u.name, u.full_name, u.username) as partner_name,
         u.avatar_url as partner_avatar
       FROM relationship_pairs rp
       INNER JOIN pair_members pm ON pm.pair_id = rp.id
       INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.user_id != ? AND pm.pair_id IN (
         SELECT pair_id FROM pair_members WHERE user_id = ?
       ) AND rp.status = 'CONNECTED'`,
      [currentUserId, currentUserId]
    );

    if (pairs.length === 0) {
      return res.json({ 
        success: true, 
        connection: null,
        message: 'No active connection found' 
      });
    }

    // Format connection data
    const connection = {
      pairId: pairs[0].pair_id,
      pairCode: pairs[0].pair_code,
      status: pairs[0].status,
      establishedAt: pairs[0].established_at,
      partners: pairs.map(p => ({
        id: p.partner_id,
        email: p.partner_email,
        name: p.partner_name,
        avatar: p.partner_avatar,
        role: p.member_role
      }))
    };

    res.json({ success: true, connection });

  } catch (error) {
    console.error('Error fetching connection data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch connection data',
      error: error.message 
    });
  }
});

router.delete('/my-connection', async (req, res) => {
  const currentUserId = getCurrentUserId(req);
  if (!currentUserId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [membershipRows] = await connection.execute(
      `
        SELECT rp.id AS pair_id
        FROM relationship_pairs rp
        INNER JOIN pair_members pm ON pm.pair_id = rp.id
        WHERE pm.user_id = ?
          AND rp.status IN ('CONNECTED', 'SYNCING', 'PENDING', 'UNPAIRED', 'SUSPENDED')
        ORDER BY rp.updated_at DESC, rp.id DESC
        LIMIT 1
      `,
      [currentUserId],
    );

    const pairId = Number(membershipRows[0]?.pair_id || 0);
    if (!pairId) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'No relationship found to unpair.',
      });
    }

    await connection.execute(
      `DELETE FROM ring_pair_links WHERE pair_id = ?`,
      [pairId],
    );
    await connection.execute(
      `DELETE FROM pair_members WHERE pair_id = ?`,
      [pairId],
    );
    await connection.execute(
      `DELETE FROM relationship_pairs WHERE id = ?`,
      [pairId],
    );

    await connection.commit();

    return res.json({
      success: true,
      message: 'Relationship unpaired successfully.',
      pairId,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error unpairing relationship:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unpair relationship',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
