const crypto = require('crypto');
const express = require('express');
const { query, pool } = require('../config/db');

const router = express.Router();

function buildSafeUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name || '',
    role: row.role || 'user',
    provider: row.provider || null,
  };
}

router.post('/', async (req, res, next) => {
  try {
    const { email, password, remember } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const users = await query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()],
    );

    if (!users.length) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    if (String(user.password_hash) !== String(password)) {
      return res.status(401).json({ message: 'Invalid email or password.' });
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
      const fallbackName = name || normalizedEmail.split('@')[0];
      const [insertResult] = await connection.execute(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        [normalizedEmail, generatedPassword, fallbackName, 'user'],
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
