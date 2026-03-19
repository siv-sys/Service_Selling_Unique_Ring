const express = require('express');
const bcrypt = require('bcryptjs');
const { execute, query } = require('../config/db');
const { requireAuth } = require('../middleware/auth.middleware');
const { issueAuthSession } = require('../services/auth-session.service');
const { normalizeRole, toSafeUser } = require('../utils/auth');

const router = express.Router();
const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 9;

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, autoLogin } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: 'Password must be more than 8 characters.' });
    }

    const existingUsers = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (existingUsers.length) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const displayName = String(name || '').trim() || normalizedEmail.split('@')[0];
    const passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);

    const result = await execute(
      'INSERT INTO users (email, password_hash, username, full_name, name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [normalizedEmail, passwordHash, displayName, displayName, displayName, 'user'],
    );

    const createdUsers = await query(
      'SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1',
      [result.insertId],
    );
    const user = createdUsers[0];

    if (!autoLogin) {
      return res.status(201).json({
        message: 'Register successful.',
        user: toSafeUser(user),
      });
    }

    const session = await issueAuthSession(user, req);
    return res.status(201).json({
      message: 'Register successful.',
      ...session,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({
    message: 'Current user loaded.',
    user: req.auth.user,
  });
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    if (req.body?.all) {
      await execute(
        'UPDATE auth_sessions SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL',
        [req.auth.user.id],
      );
    } else {
      await execute('UPDATE auth_sessions SET revoked_at = UTC_TIMESTAMP() WHERE id = ?', [req.auth.sessionId]);
    }

    await execute('UPDATE users SET remember_token = NULL WHERE id = ?', [req.auth.user.id]);

    return res.json({ message: 'Logout successful.' });
  } catch (error) {
    return next(error);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, newPassword } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required.' });
    }

    if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: 'Password must be more than 8 characters.' });
    }

    const users = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (!users.length) {
      return res.status(404).json({ message: 'User not found for this email.' });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), BCRYPT_ROUNDS);
    await execute('UPDATE users SET password_hash = ?, remember_token = NULL WHERE id = ?', [
      passwordHash,
      users[0].id,
    ]);
    await execute('UPDATE auth_sessions SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL', [
      users[0].id,
    ]);

    return res.json({ message: 'Password reset successful.' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
