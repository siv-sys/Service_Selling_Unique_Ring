const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { execute, pool, query } = require('../config/db');
const { issueAuthSession } = require('../services/auth-session.service');
const { normalizeRole, toSafeUser } = require('../utils/auth');

const router = express.Router();
const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 9;

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ''));
}

router.post('/', async (req, res, next) => {
  try {
    const { email, password, remember } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: 'Password must be more than 8 characters.' });
    }

    const users = await query(
      'SELECT id, email, password_hash, name, role, account_status FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail],
    );

    if (!users.length) {
      return res.status(401).json({ message: 'Email not found.' });
    }

    const user = users[0];
    if (String(user.account_status || 'ACTIVE').toUpperCase() !== 'ACTIVE') {
      return res.status(403).json({ message: 'This account is not active.' });
    }

    const providedPassword = String(password);
    let passwordMatches = false;

    if (isBcryptHash(user.password_hash)) {
      passwordMatches = await bcrypt.compare(providedPassword, String(user.password_hash));
    } else if (String(user.password_hash) === providedPassword) {
      passwordMatches = true;
      const upgradedHash = await bcrypt.hash(providedPassword, BCRYPT_ROUNDS);
      await execute('UPDATE users SET password_hash = ? WHERE id = ?', [upgradedHash, user.id]);
    }

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    let rememberToken = null;
    if (remember) {
      rememberToken = crypto.randomUUID();
      await execute('UPDATE users SET remember_token = ? WHERE id = ?', [rememberToken, user.id]);
    } else {
      await execute('UPDATE users SET remember_token = NULL WHERE id = ?', [user.id]);
    }

    const session = await issueAuthSession(user, req);
    return res.json({
      message: 'Login successful.',
      ...session,
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
      'SELECT id, email, name, role, account_status FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail],
    );

    let userRow;
    if (existingUsers.length) {
      userRow = existingUsers[0];
      if (String(userRow.account_status || 'ACTIVE').toUpperCase() !== 'ACTIVE') {
        await connection.rollback();
        return res.status(403).json({ message: 'This account is not active.' });
      }
    } else {
      const generatedPassword = `google_${crypto.randomUUID()}`;
      const generatedPasswordHash = await bcrypt.hash(generatedPassword, BCRYPT_ROUNDS);
      const fallbackName = String(name || '').trim() || normalizedEmail.split('@')[0];
      const [insertResult] = await connection.execute(
        `
          INSERT INTO users (email, password_hash, username, full_name, name, role)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [normalizedEmail, generatedPasswordHash, fallbackName, fallbackName, fallbackName, 'user'],
      );
      userRow = {
        id: insertResult.insertId,
        email: normalizedEmail,
        name: fallbackName,
        role: 'user',
      };
    }

    const resolvedProviderId = String(providerId || normalizedEmail).trim();
    const [providers] = await connection.execute(
      'SELECT id FROM user_providers WHERE provider = ? AND provider_id = ? LIMIT 1',
      ['google', resolvedProviderId],
    );

    if (!providers.length) {
      await connection.execute(
        'INSERT INTO user_providers (user_id, provider, provider_id) VALUES (?, ?, ?)',
        [userRow.id, 'google', resolvedProviderId],
      );
    }

    await connection.commit();

    const session = await issueAuthSession(
      {
        ...userRow,
        role: normalizeRole(userRow.role),
      },
      req,
    );

    return res.json({
      message: 'Google login successful.',
      user: {
        ...toSafeUser(userRow),
        provider: 'google',
      },
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
      rememberToken: null,
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;
