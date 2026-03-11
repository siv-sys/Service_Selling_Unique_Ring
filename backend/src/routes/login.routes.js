const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/db');

const router = express.Router();
const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 9;

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase() === 'admin' ? 'admin' : 'user';
}

function buildSafeUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name || '',
    role: normalizeRole(row.role),
    provider: row.provider || null,
  };
}

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ''));
}

router.post('/', async (req, res, next) => {
  try {
    const { email, password, remember } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: 'Password must be more than 8 characters.' });
    }

    const users = await query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()],
    );

    if (!users.length) {
      return res.status(401).json({ message: 'Email not found.' });
    }

    const user = users[0];
    const providedPassword = String(password);
    let passwordMatches = false;

    if (isBcryptHash(user.password_hash)) {
      passwordMatches = await bcrypt.compare(providedPassword, String(user.password_hash));
    } else if (String(user.password_hash) === providedPassword) {
      passwordMatches = true;
      const upgradedHash = await bcrypt.hash(providedPassword, BCRYPT_ROUNDS);
      await query('UPDATE users SET password_hash = ? WHERE id = ?', [upgradedHash, user.id]);
    }

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    let rememberToken = null;
    if (remember) {
      rememberToken = crypto.randomUUID();
      await query('UPDATE users SET remember_token = ? WHERE id = ?', [rememberToken, user.id]);
    }

    return res.json({
      message: 'Login successful.',
      user: buildSafeUser(user),
      rememberToken,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/google', async (req, res, next) => {
  const { email, providerId, name } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.execute(
      'SELECT id, email, name, role FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail],
    );

    let userId;
    let userRow;
    if (existingUsers.length) {
      userRow = existingUsers[0];
      userId = userRow.id;
    } else {
      const generatedPassword = `google_${crypto.randomUUID()}`;
      const generatedPasswordHash = await bcrypt.hash(generatedPassword, BCRYPT_ROUNDS);
      const fallbackName = name || normalizedEmail.split('@')[0];
      const [insertResult] = await connection.execute(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        [normalizedEmail, generatedPasswordHash, fallbackName, 'user'],
      );
      userId = insertResult.insertId;
      userRow = {
        id: userId,
        email: normalizedEmail,
        name: fallbackName,
        role: 'user',
      };
    }

    const resolvedProviderId = String(providerId || normalizedEmail);
    const [providers] = await connection.execute(
      'SELECT id FROM user_providers WHERE provider = ? AND provider_id = ? LIMIT 1',
      ['google', resolvedProviderId],
    );

    if (!providers.length) {
      await connection.execute(
        'INSERT INTO user_providers (user_id, provider, provider_id) VALUES (?, ?, ?)',
        [userId, 'google', resolvedProviderId],
      );
    }

    await connection.commit();

    return res.json({
      message: 'Google login successful.',
      user: {
        ...buildSafeUser(userRow),
        provider: 'google',
      },
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;
