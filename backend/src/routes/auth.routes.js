const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

const router = express.Router();
const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 9;

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase() === 'admin' ? 'admin' : 'user';
}

function toSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    role: normalizeRole(user.role),
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body || {};
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

    const safeRole = normalizeRole(role);
    const displayName = String(name || '').trim() || normalizedEmail.split('@')[0];
    const passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);

    const result = await query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [normalizedEmail, passwordHash, displayName, safeRole],
    );

    const createdUsers = await query('SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1', [result.insertId]);
    return res.status(201).json({
      message: 'Register successful.',
      user: toSafeUser(createdUsers[0]),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const rawUserId = req.header('x-auth-user-id');
    const userId = Number(rawUserId);

    if (!rawUserId || Number.isNaN(userId)) {
      return res.status(401).json({ message: 'Missing auth user id.' });
    }

    const users = await query('SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!users.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({
      message: 'Current user loaded.',
      user: toSafeUser(users[0]),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const rawUserId = req.body?.userId ?? req.header('x-auth-user-id');
    const userId = Number(rawUserId);

    if (rawUserId && !Number.isNaN(userId)) {
      await query('UPDATE users SET remember_token = NULL WHERE id = ?', [userId]);
    }

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
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, users[0].id]);

    return res.json({ message: 'Password reset successful.' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
