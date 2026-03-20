const express = require('express');
const crypto = require('crypto');
const { query } = require('../config/db');
const { createNotification } = require('../services/notifications.service');

const router = express.Router();

// Search users by email or name
router.get('/search-users', async (req, res) => {
  try {
    const searchQuery = req.query.q || '';
    const currentUserId = Number(req.header('x-auth-user-id'));

    if (!searchQuery || searchQuery.length < 2) {
      return res.json({ success: true, users: [] });
    }

    // Search for users by email or name
    const users = await query(
      `
        SELECT 
          id,
          email,
          COALESCE(name, full_name, username, SUBSTRING_INDEX(email, '@', 1)) AS display_name,
          avatar_url,
          account_status
        FROM users
        WHERE id != ?
          AND (
            email LIKE ? 
            OR name LIKE ?
            OR full_name LIKE ?
            OR username LIKE ?
          )
        ORDER BY 
          CASE 
            WHEN email = ? THEN 0
            WHEN email LIKE ? THEN 1
            ELSE 2
          END,
          display_name
        LIMIT 10
      `,
      [
        currentUserId,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        searchQuery,
        `${searchQuery}%`
      ]
    );

    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      displayName: user.display_name || user.email,
      avatar: user.avatar_url || null,
      accountStatus: user.account_status || 'ACTIVE'
    }));

    res.json({ success: true, users: formattedUsers });

  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to search users',
      error: error.message 
    });
  }
});

// Send a pair invitation
router.post('/send', async (req, res) => {
  try {
    const inviterUserId = Number(req.header('x-auth-user-id'));
    const { inviteeEmail, inviteeRingIdentifier } = req.body;

    if (!inviterUserId || !inviteeEmail) {
      return res.status(400).json({ message: 'Inviter user ID and invitee email are required' });
    }

    // Find or create invitee user by email
    let inviteeUserRows = await query(
      'SELECT id, email FROM users WHERE email = ? LIMIT 1',
      [inviteeEmail]
    );

    let inviteeUserId = null;
    if (inviteeUserRows.length === 0) {
      // User doesn't exist - create invitation with just email
      const invitationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const [result] = await query(
        `INSERT INTO pair_invitations 
         (inviter_user_id, invitee_handle, invitee_ring_identifier, invitation_token, status, expires_at, created_at)
         VALUES (?, ?, ?, ?, 'PENDING', ?, NOW())`,
        [inviterUserId, inviteeEmail, inviteeRingIdentifier || null, invitationToken, expiresAt]
      );

      return res.json({ 
        success: true, 
        message: `Invitation sent to ${inviteeEmail}`,
        invitationId: result.insertId 
      });
    }

    inviteeUserId = inviteeUserRows[0].id;

    // Check if there's already a pending invitation
    const existingInvites = await query(
      `SELECT id FROM pair_invitations 
       WHERE inviter_user_id = ? AND invitee_user_id = ? AND status = 'PENDING'`,
      [inviterUserId, inviteeUserId]
    );

    if (existingInvites.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'You already have a pending invitation to this user' 
      });
    }

    // Create the invitation
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [result] = await query(
      `INSERT INTO pair_invitations 
       (inviter_user_id, invitee_user_id, invitee_ring_identifier, invitation_token, status, expires_at, created_at)
       VALUES (?, ?, ?, ?, 'PENDING', ?, NOW())`,
      [inviterUserId, inviteeUserId, inviteeRingIdentifier || null, invitationToken, expiresAt]
    );

    const invitationId = result.insertId;

    // Get inviter info for notification
    const inviterInfo = await query(
      'SELECT email, COALESCE(name, full_name, username) as name FROM users WHERE id = ?',
      [inviterUserId]
    );

    // Create notification for invitee
    await createNotification({
      userId: inviteeUserId,
      type: 'pair_invitation',
      icon: '\u{1F491}',
      actionKey: 'pair_invitation_accept_reject',
      title: 'New Connection Request',
      message: `You have received a connection request from ${inviterInfo[0].name || inviterInfo[0].email}. Accept to start your journey together!`,
      metadata: {
        invitationId,
        inviterUserId,
        inviterEmail: inviterInfo[0].email
      }
    });

    // Emit real-time notification via Socket.io
    if (global.io) {
      global.io.to(`user_${inviteeUserId}`).emit('notification', {
        type: 'pair_invitation',
        invitationId,
        from: inviterInfo[0].name || inviterInfo[0].email
      });
    }

    res.json({ 
      success: true, 
      message: `Invitation sent to ${inviteeEmail}`,
      invitationId 
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send invitation',
      error: error.message 
    });
  }
});

// Cancel a pending invitation (for User A)
router.post('/:invitationId/cancel', async (req, res) => {
  try {
    const invitationId = Number(req.params.invitationId);
    const currentUserId = Number(req.header('x-auth-user-id'));

    // Verify the invitation belongs to the current user
    const [rows] = await query(
      `SELECT * FROM pair_invitations WHERE id = ? AND inviter_user_id = ?`,
      [invitationId, currentUserId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    const invitation = rows[0];

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ message: 'Can only cancel pending invitations' });
    }

    // Update status to CANCELLED
    await query(
      `UPDATE pair_invitations SET status = 'CANCELLED', responded_at = NOW() WHERE id = ?`,
      [invitationId]
    );

    res.json({ success: true, message: 'Invitation cancelled successfully' });

  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to cancel invitation',
      error: error.message 
    });
  }
});

// Accept an invitation (for User B)
router.post('/:invitationId/accept', async (req, res) => {
  try {
    const invitationId = Number(req.params.invitationId);
    const currentUserId = Number(req.header('x-auth-user-id'));

    // Get invitation details
    const [rows] = await query(
      `SELECT * FROM pair_invitations WHERE id = ? AND invitee_user_id = ?`,
      [invitationId, currentUserId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    const invitation = rows[0];

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ message: 'This invitation is no longer pending' });
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Update invitation status to ACCEPTED
      await query(
        `UPDATE pair_invitations 
         SET status = 'ACCEPTED', responded_at = NOW() 
         WHERE id = ?`,
        [invitationId]
      );

      // Create relationship pair
      const pairCode = crypto.randomUUID();
      const [pairResult] = await query(
        `INSERT INTO relationship_pairs 
         (pair_code, status, access_level, established_at, created_at)
         VALUES (?, 'CONNECTED', 'FULL_ACCESS', NOW(), NOW())`,
        [pairCode]
      );

      const pairId = pairResult.insertId;

      // Add both users as partners
      await query(
        `INSERT INTO pair_members (pair_id, user_id, member_role, joined_at)
         VALUES (?, ?, 'PARTNER_A', NOW()), (?, ?, 'PARTNER_B', NOW())`,
        [pairId, invitation.inviter_user_id, pairId, invitation.invitee_user_id]
      );

      // Notify inviter that their invitation was accepted
      const inviteeInfo = await query(
        'SELECT email, COALESCE(name, full_name, username) as name FROM users WHERE id = ?',
        [invitation.invitee_user_id]
      );

      await createNotification({
        userId: invitation.inviter_user_id,
        type: 'pair_invitation_accepted',
        icon: '\u2764\uFE0F',
        actionKey: null,
        title: 'Connection Established!',
        message: `Your connection request was accepted by ${inviteeInfo[0].name || inviteeInfo[0].email}. You can now access couple features!`,
        metadata: {
          pairId,
          pairCode,
          acceptedBy: inviteeInfo[0].email
        }
      });

      await query('COMMIT');

      // Emit real-time notification
      if (global.io) {
        global.io.to(`user_${invitation.inviter_user_id}`).emit('connection_established', {
          pairId,
          pairCode,
          acceptedBy: inviteeInfo[0].name || inviteeInfo[0].email
        });
      }

      res.json({ 
        success: true, 
        message: 'Connection established successfully!',
        pairId,
        pairCode
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to accept invitation',
      error: error.message 
    });
  }
});

// Reject an invitation (for User B)
router.post('/:invitationId/reject', async (req, res) => {
  try {
    const invitationId = Number(req.params.invitationId);
    const currentUserId = Number(req.header('x-auth-user-id'));

    // Get invitation details
    const [rows] = await query(
      `SELECT * FROM pair_invitations WHERE id = ? AND invitee_user_id = ?`,
      [invitationId, currentUserId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    const invitation = rows[0];

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ message: 'This invitation is no longer pending' });
    }

    // Update status to REJECTED
    await query(
      `UPDATE pair_invitations 
       SET status = 'REJECTED', responded_at = NOW() 
       WHERE id = ?`,
      [invitationId]
    );

    // Notify inviter that their invitation was rejected
    const inviteeInfo = await query(
      'SELECT email, COALESCE(name, full_name, username) as name FROM users WHERE id = ?',
      [invitation.invitee_user_id]
    );

    await createNotification({
      userId: invitation.inviter_user_id,
      type: 'pair_invitation_rejected',
      icon: '\u{1F494}',
      actionKey: null,
      title: 'Connection Request Declined',
      message: `Your connection request was declined by ${inviteeInfo[0].name || inviteeInfo[0].email}.`,
      metadata: {
        invitationId,
        rejectedBy: inviteeInfo[0].email
      }
    });

    res.json({ success: true, message: 'Invitation rejected' });

  } catch (error) {
    console.error('Error rejecting invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reject invitation',
      error: error.message 
    });
  }
});

// Get my invitations (sent and received)
router.get('/my-invitations', async (req, res) => {
  try {
    const currentUserId = Number(req.header('x-auth-user-id'));

    // Get sent invitations
    const sent = await query(
      `SELECT 
         pi.id,
         pi.status,
         pi.created_at,
         pi.responded_at,
         u.id as invitee_id,
         u.email as invitee_email,
         COALESCE(u.name, u.full_name, u.username, SUBSTRING_INDEX(u.email, '@', 1)) as invitee_name,
         u.avatar_url as invitee_avatar
       FROM pair_invitations pi
       LEFT JOIN users u ON u.id = pi.invitee_user_id
       WHERE pi.inviter_user_id = ?
       ORDER BY pi.created_at DESC`,
      [currentUserId]
    );

    // Get received invitations
    const received = await query(
      `SELECT 
         pi.id,
         pi.status,
         pi.created_at,
         pi.responded_at,
         u.id as inviter_id,
         u.email as inviter_email,
         COALESCE(u.name, u.full_name, u.username, SUBSTRING_INDEX(u.email, '@', 1)) as inviter_name,
         u.avatar_url as inviter_avatar
       FROM pair_invitations pi
       LEFT JOIN users u ON u.id = pi.inviter_user_id
       WHERE pi.invitee_user_id = ?
       ORDER BY pi.created_at DESC`,
      [currentUserId]
    );

    res.json({ 
      success: true,
      invitations: {
        sent: sent.map(inv => ({
          id: inv.id,
          type: 'sent',
          status: inv.status,
          createdAt: inv.created_at,
          respondedAt: inv.responded_at,
          user: {
            id: inv.invitee_id,
            email: inv.invitee_email,
            name: inv.invitee_name,
            avatar: inv.invitee_avatar
          }
        })),
        received: received.map(inv => ({
          id: inv.id,
          type: 'received',
          status: inv.status,
          createdAt: inv.created_at,
          respondedAt: inv.responded_at,
          user: {
            id: inv.inviter_id,
            email: inv.inviter_email,
            name: inv.inviter_name,
            avatar: inv.inviter_avatar
          }
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch invitations',
      error: error.message 
    });
  }
});

module.exports = router;
