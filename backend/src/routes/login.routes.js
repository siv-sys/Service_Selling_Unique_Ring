const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { execute, pool, query } = require('../config/db');
const { issueAuthSession } = require('../services/auth-session.service');
const { normalizeRole, parseRole, toSafeUser } = require('../utils/auth');

const router = express.Router();
const BCRYPT_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ''));
}

const LOGIN_USER_SELECT = `
  SELECT
    id,
    email,
    password_hash,
    COALESCE(NULLIF(name, ''), NULLIF(full_name, ''), NULLIF(username, ''), SUBSTRING_INDEX(email, '@', 1)) AS name,
    role,
    COALESCE(account_status, 'ACTIVE') AS account_status
  FROM users
  WHERE LOWER(email) = ?
  LIMIT 1
`;

router.post('/', async (req, res, next) => {
  try {
    const { email, password, remember } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const users = await query(LOGIN_USER_SELECT, [normalizedEmail]);

    if (!users.length) {
      return res.status(401).json({ message: 'Email not found.' });
    }

    const user = users[0];
    const validatedRole = parseRole(user.role);

    if (String(user.account_status || 'ACTIVE').toUpperCase() !== 'ACTIVE') {
      return res.status(403).json({ message: 'This account is not active.' });
    }

    if (!validatedRole) {
      return res.status(403).json({ message: 'This account does not have a valid role.' });
    }

    const providedPassword = String(password);
    let passwordMatches = false;

    const storedPasswordHash = String(user.password_hash || '');

    if (isBcryptHash(storedPasswordHash)) {
      passwordMatches = await bcrypt.compare(providedPassword, storedPasswordHash);
    } else if (storedPasswordHash === providedPassword || storedPasswordHash.trim() === providedPassword) {
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

    const session = await issueAuthSession(
      {
        ...user,
        role: validatedRole,
      },
      req,
    );
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

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.execute(LOGIN_USER_SELECT, [normalizedEmail]);

    let userRow;
    if (existingUsers.length) {
      userRow = existingUsers[0];
      const validatedRole = parseRole(userRow.role);
      if (String(userRow.account_status || 'ACTIVE').toUpperCase() !== 'ACTIVE') {
        await connection.rollback();
        return res.status(403).json({ message: 'This account is not active.' });
      }
      if (!validatedRole) {
        await connection.rollback();
        return res.status(403).json({ message: 'This account does not have a valid role.' });
      }
      userRow.role = validatedRole;
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
