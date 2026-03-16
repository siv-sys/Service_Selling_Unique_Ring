const express = require('express');
const crypto = require('crypto');
const { query, execute } = require('../config/db');

const router = express.Router();

// Helper: Hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper: Generate user token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// GET /api/users - Get all users (with pagination)
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const ringModel = req.query.ringModel || '';
    const osPlatform = req.query.osPlatform || '';

    let whereClause = 'WHERE u.account_status <> "DELETED"';
    const params = {};

    if (search) {
      whereClause += ' AND (u.username LIKE :search OR u.full_name LIKE :search OR u.email LIKE :search)';
      params.search = `%${search}%`;
    }

    if (status) {
      whereClause += ' AND u.account_status = :status';
      params.status = status;
    }

    // Get total count
    const [countResult] = await query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = countResult.total;

    // Get users with pair info
    const users = await query(
      `SELECT 
        u.id,
        u.username,
        u.full_name,
        u.email,
        u.name,
        u.role,
        u.account_status,
        u.created_at,
        u.updated_at,
        up.id as pair_id,
        up.pair_code,
        up.pair_name,
        up.status as pair_status,
        pm.member_role
      FROM users u
      LEFT JOIN pair_members pm ON u.id = pm.user_id
      LEFT JOIN user_pairs up ON pm.pair_id = up.id
      ${whereClause}
      ORDER BY u.updated_at DESC
      LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset }
    );

    // Format users with pair info
    const formattedUsers = users.map(user => ({
      id: user.id,
      userId: `usr-${user.id}`,
      name: user.full_name || user.name || user.username,
      email: user.email,
      role: user.role,
      status: user.account_status,
      pair: user.pair_id ? {
        pairId: user.pair_id,
        pairCode: user.pair_code,
        pairName: user.pair_name,
        memberRole: user.member_role
      } : null,
      lastActive: user.updated_at,
      createdAt: user.created_at
    }));

    res.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [user] = await query(
      `SELECT 
        id,
        username,
        full_name,
        email,
        name,
        role,
        account_status,
        created_at,
        updated_at
      FROM users
      WHERE id = :id`,
      { id }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user roles
    const roles = await query(
      `SELECT r.id, r.name, r.description
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = :id`,
      { id }
    );

    // Get user's pair info
    const [pairInfo] = await query(
      `SELECT 
        up.id as pair_id,
        up.pair_code,
        up.pair_name,
        up.status as pair_status,
        pm.member_role
      FROM pair_members pm
      JOIN user_pairs up ON pm.pair_id = up.id
      WHERE pm.user_id = :id AND pm.member_status = 'ACTIVE'`,
      { id }
    );

    res.json({
      success: true,
      user: {
        ...user,
        roles,
        pair: pairInfo || null
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res, next) => {
  try {
    const {
      username,
      full_name,
      email,
      password,
      avatar_url,
      city,
      is_public_discovery = 1
    } = req.body;

    // Validation
    if (!username || !full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, full name, email, and password are required'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if username or email exists
    const [existing] = await query(
      `SELECT id FROM users WHERE username = :username OR email = :email`,
      { username, email }
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const password_hash = hashPassword(password);

    // Create user
    const result = await execute(
      `INSERT INTO users (username, full_name, email, password_hash, avatar_url, city, is_public_discovery)
       VALUES (:username, :full_name, :email, :password_hash, :avatar_url, :city, :is_public_discovery)`,
      { username, full_name, email, password_hash, avatar_url, city, is_public_discovery }
    );

    const userId = result.insertId;

    // Assign default role (MEMBER = 2)
    await execute(
      `INSERT INTO user_roles (user_id, role_id) VALUES (:userId, 2)`,
      { userId }
    );

    const [newUser] = await query(
      `SELECT id, username, full_name, email, name, role, account_status, created_at
       FROM users WHERE id = :userId`,
      { userId }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      name,
      role,
      account_status
    } = req.body;

    // Check if user exists
    const [user] = await query('SELECT id FROM users WHERE id = :id', { id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Build update query
    const updates = [];
    const params = { id };

    if (full_name !== undefined) {
      updates.push('full_name = :full_name');
      params.full_name = full_name;
    }

    if (email !== undefined) {
      // Check email uniqueness
      const [existing] = await query(
        'SELECT id FROM users WHERE email = :email AND id != :id',
        { email, id }
      );
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
      updates.push('email = :email');
      params.email = email;
    }

    if (name !== undefined) {
      updates.push('name = :name');
      params.name = name;
    }

    if (role !== undefined) {
      updates.push('role = :role');
      params.role = role;
    }

    if (account_status !== undefined) {
      updates.push('account_status = :account_status');
      params.account_status = account_status;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    await execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = :id`,
      params
    );

    const [updatedUser] = await query(
      `SELECT id, username, full_name, email, name, role, account_status, updated_at
       FROM users WHERE id = :id`,
      { id }
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/password - Change password
router.patch('/:id/password', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Verify current password
    const [user] = await query(
      'SELECT password_hash FROM users WHERE id = :id',
      { id }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const current_hash = hashPassword(current_password);
    if (current_hash !== user.password_hash) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password
    const new_hash = hashPassword(new_password);
    await execute(
      'UPDATE users SET password_hash = :new_hash WHERE id = :id',
      { new_hash, id }
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Delete user (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [user] = await query('SELECT id FROM users WHERE id = :id', { id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Soft delete - update status
    await execute(
      `UPDATE users SET account_status = 'DELETED', username = CONCAT(username, '_deleted_', UNIX_TIMESTAMP()) WHERE id = :id`,
      { id }
    );

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id/activity - Get user activity log
router.get('/:id/activity', async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const activities = await query(
      `SELECT 
        pa.*,
        up.pair_code
      FROM pair_activities pa
      LEFT JOIN user_pairs up ON pa.pair_id = up.id
      WHERE pa.user_id = :id
      ORDER BY pa.created_at DESC
      LIMIT :limit OFFSET :offset`,
      { id, limit, offset }
    );

    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM pair_activities WHERE user_id = :id',
      { id }
    );

    res.json({
      success: true,
      activities,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
