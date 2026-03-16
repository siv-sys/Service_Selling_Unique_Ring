const express = require('express');
const crypto = require('crypto');
const { query, execute } = require('../config/db');

const router = express.Router();

// Helper: Log activity
async function logActivity(pairId, userId, activityType, activityData = null) {
  try {
    await execute(
      `INSERT INTO pair_activities (pair_id, user_id, activity_type, activity_data)
       VALUES (:pairId, :userId, :activityType, :activityData)`,
      { pairId, userId, activityType, activityData: activityData ? JSON.stringify(activityData) : null }
    );
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
}

// Helper: Generate unique pair code
function generatePairCode() {
  return 'PAIR-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Helper: Generate invitation token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// GET /api/user-pairs/my-pairs - Get all pairs for current user
router.get('/my-pairs', async (req, res, next) => {
  try {
    const userId = req.headers['x-auth-user-id'] || req.query.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const pairs = await query(
      `SELECT 
        up.id,
        up.pair_code,
        up.pair_name,
        up.status,
        up.access_level,
        up.established_at,
        up.created_at,
        up.updated_at,
        pm.member_role as my_role,
        (SELECT COUNT(*) FROM pair_members WHERE pair_id = up.id) as member_count
      FROM user_pairs up
      JOIN pair_members pm ON up.id = pm.pair_id
      WHERE pm.user_id = :userId
      ORDER BY up.created_at DESC`,
      { userId }
    );

    // Get members for each pair
    for (const pair of pairs) {
      const members = await query(
        `SELECT 
          u.id as userId,
          u.username,
          u.full_name as fullName,
          pm.member_role as role,
          pm.joined_at as joinedAt
        FROM pair_members pm
        LEFT JOIN users u ON pm.user_id = u.id
        WHERE pm.pair_id = :pairId`,
        { pairId: pair.id }
      );
      pair.members = members;
    }

    res.json({ success: true, pairs });
  } catch (error) {
    next(error);
  }
});

// GET /api/user-pairs/:pairId - Get pair details
router.get('/:pairId', async (req, res, next) => {
  try {
    const { pairId } = req.params;
    const userId = req.headers['x-auth-user-id'] || req.query.userId;

    const [pair] = await query(
      `SELECT * FROM user_pairs WHERE id = :pairId`,
      { pairId }
    );

    if (!pair) {
      return res.status(404).json({ success: false, message: 'Pair not found' });
    }

    // Check if user is a member
    const [membership] = await query(
      'SELECT member_role FROM pair_members WHERE pair_id = :pairId AND user_id = :userId',
      { pairId, userId }
    );

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get members
    const members = await query(
      `SELECT 
        u.id as userId,
        u.username,
        u.full_name as fullName,
        u.email,
        pm.member_role as role,
        pm.joined_at as joinedAt
      FROM pair_members pm
      LEFT JOIN users u ON pm.user_id = u.id
      WHERE pm.pair_id = :pairId`,
      { pairId }
    );

    // Get pending invitations
    const pendingInvitations = await query(
      `SELECT 
        id,
        invitee_email as inviteeEmail,
        invitee_username as inviteeUsername,
        status,
        expires_at as expiresAt,
        created_at as createdAt
      FROM pair_invitations
      WHERE pair_id = :pairId AND status = 'PENDING'`,
      { pairId }
    );

    res.json({ 
      success: true, 
      pair: {
        ...pair,
        members,
        pendingInvitations,
        myRole: membership.member_role
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/user-pairs - Create a new pair
router.post('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-auth-user-id'] || req.body.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { pairName, pairCode: customCode } = req.body;
    const pairCode = customCode?.trim().toUpperCase() || generatePairCode();

    if (pairCode.length < 3) {
      return res.status(400).json({ success: false, message: 'Pair code must be at least 3 characters' });
    }

    // Check if user already has a pair
    const [existingPair] = await query(
      'SELECT pair_id FROM pair_members WHERE user_id = :userId',
      { userId }
    );

    if (existingPair) {
      return res.status(409).json({ success: false, message: 'User already belongs to a pair' });
    }

    // Create the pair
    const result = await execute(
      `INSERT INTO user_pairs (pair_code, pair_name, status, access_level, created_by_user_id)
       VALUES (:pairCode, :pairName, 'PENDING', 'FULL_ACCESS', :userId)`,
      { pairCode, pairName: pairName || null, userId }
    );

    const pairId = result.insertId;

    // Add creator as OWNER
    await execute(
      `INSERT INTO pair_members (pair_id, user_id, member_role) VALUES (:pairId, :userId, 'OWNER')`,
      { pairId, userId }
    );

    // Log activity
    await logActivity(pairId, userId, 'PAIR_CREATED', { pairCode, pairName });

    const [newPair] = await query(
      `SELECT * FROM user_pairs WHERE id = :pairId`,
      { pairId }
    );

    res.status(201).json({
      success: true,
      message: 'Pair created successfully',
      pair: newPair
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Pair code already exists' });
    }
    next(error);
  }
});

// PATCH /api/user-pairs/:pairId - Update pair details
router.patch('/:pairId', async (req, res, next) => {
  try {
    const { pairId } = req.params;
    const userId = req.headers['x-auth-user-id'] || req.body.userId;
    const { pairName, status, accessLevel } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Check if user is OWNER
    const [membership] = await query(
      `SELECT member_role FROM pair_members WHERE pair_id = :pairId AND user_id = :userId`,
      { pairId, userId }
    );

    if (!membership || membership.member_role !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Only owner can update pair' });
    }

    const updates = [];
    const params = { pairId };

    if (pairName !== undefined) {
      updates.push('pair_name = :pairName');
      params.pairName = pairName;
    }

    if (status && ['PENDING', 'CONNECTED', 'SYNCING', 'SUSPENDED', 'UNPAIRED'].includes(status)) {
      updates.push('status = :status');
      params.status = status;
      if (status === 'CONNECTED') {
        updates.push('established_at = CURDATE()');
      }
    }

    if (accessLevel && ['FULL_ACCESS', 'LIMITED', 'REVOKED'].includes(accessLevel)) {
      updates.push('access_level = :accessLevel');
      params.accessLevel = accessLevel;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    await execute(
      `UPDATE user_pairs SET ${updates.join(', ')} WHERE id = :pairId`,
      params
    );

    await logActivity(pairId, userId, 'PAIR_UPDATED', { pairName, status, accessLevel });

    res.json({ success: true, message: 'Pair updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/user-pairs/:pairId - Delete pair or leave pair
router.delete('/:pairId', async (req, res, next) => {
  try {
    const { pairId } = req.params;
    const userId = req.headers['x-auth-user-id'] || req.query.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const [membership] = await query(
      `SELECT member_role FROM pair_members WHERE pair_id = :pairId AND user_id = :userId`,
      { pairId, userId }
    );

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Not a member of this pair' });
    }

    if (membership.member_role === 'OWNER') {
      await execute('DELETE FROM user_pairs WHERE id = :pairId', { pairId });
      res.json({ success: true, message: 'Pair deleted successfully' });
    } else {
      await execute(
        'DELETE FROM pair_members WHERE pair_id = :pairId AND user_id = :userId',
        { pairId, userId }
      );
      await logActivity(pairId, userId, 'MEMBER_LEFT', {});
      res.json({ success: true, message: 'Left pair successfully' });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/user-pairs/:pairId/invite - Invite user to pair
router.post('/:pairId/invite', async (req, res, next) => {
  try {
    const { pairId } = req.params;
    const userId = req.headers['x-auth-user-id'] || req.body.userId;
    const { inviteeEmail, inviteeUsername } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Check if user is OWNER
    const [membership] = await query(
      `SELECT member_role FROM pair_members WHERE pair_id = :pairId AND user_id = :userId`,
      { pairId, userId }
    );

    if (!membership || membership.member_role !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Only owner can invite' });
    }

    // Check if pair already has 2 members
    const [memberCount] = await query(
      `SELECT COUNT(*) as count FROM pair_members WHERE pair_id = :pairId`,
      { pairId }
    );

    if (memberCount.count >= 2) {
      return res.status(409).json({ success: false, message: 'Pair is already full' });
    }

    // Check for existing pending invitation
    const [existingInvite] = await query(
      `SELECT id FROM pair_invitations 
       WHERE pair_id = :pairId AND status = 'PENDING' 
       AND (invitee_email = :inviteeEmail OR invitee_username = :inviteeUsername)`,
      { pairId, inviteeEmail: inviteeEmail || '', inviteeUsername: inviteeUsername || '' }
    );

    if (existingInvite) {
      return res.status(409).json({ success: false, message: 'Invitation already pending' });
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const result = await execute(
      `INSERT INTO pair_invitations (pair_id, inviter_user_id, invitee_email, invitee_username, invitation_token, expires_at)
       VALUES (:pairId, :userId, :inviteeEmail, :inviteeUsername, :token, :expiresAt)`,
      { pairId, userId, inviteeEmail: inviteeEmail || null, inviteeUsername: inviteeUsername || null, token, expiresAt }
    );

    await logActivity(pairId, userId, 'INVITATION_SENT', { inviteeEmail, inviteeUsername });

    res.status(201).json({
      success: true,
      message: 'Invitation sent',
      invitation: {
        id: result.insertId,
        token,
        expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/user-pairs/invitations/accept - Accept invitation
router.post('/invitations/accept', async (req, res, next) => {
  try {
    const userId = req.headers['x-auth-user-id'] || req.body.userId;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Get invitation
    const [invitation] = await query(
      `SELECT * FROM pair_invitations 
       WHERE invitation_token = :token AND status = 'PENDING' AND expires_at > NOW()`,
      { token }
    );

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invitation' });
    }

    // Check if user already in a pair
    const [existingPair] = await query(
      'SELECT pair_id FROM pair_members WHERE user_id = :userId',
      { userId }
    );

    if (existingPair) {
      return res.status(409).json({ success: false, message: 'User already belongs to a pair' });
    }

    // Add user to pair
    await execute(
      `INSERT INTO pair_members (pair_id, user_id, member_role) VALUES (:pairId, :userId, 'PARTNER')`,
      { pairId: invitation.pair_id, userId }
    );

    // Update invitation
    await execute(
      `UPDATE pair_invitations 
       SET status = 'ACCEPTED', responded_at = NOW(), invitee_user_id = :userId
       WHERE id = :id`,
      { id: invitation.id, userId }
    );

    // Update pair status to CONNECTED
    await execute(
      `UPDATE user_pairs SET status = 'CONNECTED', established_at = CURDATE() WHERE id = :pairId`,
      { pairId: invitation.pair_id }
    );

    await logActivity(invitation.pair_id, userId, 'INVITATION_ACCEPTED', {});

    res.json({ success: true, message: 'Invitation accepted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/user-pairs/invitations/decline - Decline invitation
router.post('/invitations/decline', async (req, res, next) => {
  try {
    const userId = req.headers['x-auth-user-id'] || req.body.userId;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const [invitation] = await query(
      `SELECT * FROM pair_invitations 
       WHERE invitation_token = :token AND status = 'PENDING'`,
      { token }
    );

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    await execute(
      `UPDATE pair_invitations 
       SET status = 'DECLINED', responded_at = NOW(), invitee_user_id = :userId
       WHERE id = :id`,
      { id: invitation.id, userId }
    );

    await logActivity(invitation.pair_id, userId, 'INVITATION_DECLINED', {});

    res.json({ success: true, message: 'Invitation declined' });
  } catch (error) {
    next(error);
  }
});

// GET /api/user-pairs/invitations/pending - Get pending invitations for user
router.get('/invitations/pending', async (req, res, next) => {
  try {
    const userId = req.headers['x-auth-user-id'] || req.query.userId;
    const userEmail = req.query.userEmail;
    const username = req.query.username;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const invitations = await query(
      `SELECT 
        pi.*,
        up.pair_code,
        up.pair_name,
        u.username as inviter_username,
        u.full_name as inviter_full_name
      FROM pair_invitations pi
      JOIN user_pairs up ON pi.pair_id = up.id
      LEFT JOIN users u ON pi.inviter_user_id = u.id
      WHERE pi.status = 'PENDING' AND pi.expires_at > NOW()
        AND (pi.invitee_user_id = :userId 
             OR pi.invitee_email = :userEmail 
             OR pi.invitee_username = :username)
      ORDER BY pi.created_at DESC`,
      { userId, userEmail: userEmail || '', username: username || '' }
    );

    res.json({ success: true, invitations });
  } catch (error) {
    next(error);
  }
});

// GET /api/user-pairs/:pairId/activities - Get pair activity log
router.get('/:pairId/activities', async (req, res, next) => {
  try {
    const { pairId } = req.params;
    const userId = req.headers['x-auth-user-id'] || req.query.userId;

    // Check membership
    const [membership] = await query(
      'SELECT 1 FROM pair_members WHERE pair_id = :pairId AND user_id = :userId',
      { pairId, userId }
    );

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const activities = await query(
      `SELECT 
        pa.*,
        u.username,
        u.full_name
      FROM pair_activities pa
      LEFT JOIN users u ON pa.user_id = u.id
      WHERE pa.pair_id = :pairId
      ORDER BY pa.created_at DESC
      LIMIT 50`,
      { pairId }
    );

    res.json({ success: true, activities });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
