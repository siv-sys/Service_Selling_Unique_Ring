const express = require('express');
const { query } = require('../config/db');

const router = express.Router();

// Get my connection details
router.get('/my-connection', async (req, res) => {
  try {
    const currentUserId = Number(req.header('x-auth-user-id'));

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

module.exports = router;
