const { execute, query } = require('../config/db');
const {
  extractBearerToken,
  hashTokenId,
  normalizeRole,
  toSafeUser,
  verifyAccessToken,
} = require('../utils/auth');

async function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req.header('authorization'));
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired access token.' });
    }

    const userId = Number(payload.sub);
    const tokenId = String(payload.jti || '').trim();

    if (!Number.isInteger(userId) || userId <= 0 || !tokenId) {
      return res.status(401).json({ message: 'Invalid access token payload.' });
    }

    const sessionRows = await query(
      `
        SELECT
          s.id AS session_id,
          s.expires_at,
          s.revoked_at,
          u.id,
          u.email,
          u.name,
          u.role,
          u.account_status
        FROM auth_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?
          AND s.revoked_at IS NULL
          AND s.expires_at > UTC_TIMESTAMP()
        LIMIT 1
      `,
      [hashTokenId(tokenId)],
    );

    const session = sessionRows[0];
    if (!session) {
      return res.status(401).json({ message: 'Session is no longer active.' });
    }

    if (String(session.account_status || 'ACTIVE').toUpperCase() !== 'ACTIVE') {
      return res.status(403).json({ message: 'This account is not active.' });
    }

    await execute('UPDATE auth_sessions SET last_used_at = UTC_TIMESTAMP() WHERE id = ?', [session.session_id]).catch(
      () => {},
    );

    req.auth = {
      token,
      tokenId,
      sessionId: session.session_id,
      user: {
        ...toSafeUser(session),
        role: normalizeRole(session.role),
      },
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAdmin(req, res, next) {
  if (!req.auth?.user || normalizeRole(req.auth.user.role) !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  return next();
}

module.exports = {
  requireAdmin,
  requireAuth,
};
