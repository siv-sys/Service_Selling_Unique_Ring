const crypto = require('crypto');
const { execute } = require('../config/db');
const { getExpiresAtFromToken, getSessionContext, hashTokenId, signAccessToken, toSafeUser } = require('../utils/auth');

async function issueAuthSession(user, req) {
  const tokenId = crypto.randomUUID();
  const accessToken = signAccessToken({
    sub: String(user.id),
    email: user.email,
    role: user.role,
    jti: tokenId,
  });
  const expiresAt = getExpiresAtFromToken(accessToken);
  const sessionContext = getSessionContext(req);

  if (!expiresAt) {
    throw new Error('Failed to calculate access token expiry.');
  }

  await execute(
    `
      INSERT INTO auth_sessions (user_id, token_hash, expires_at, last_used_at, user_agent, ip_address)
      VALUES (?, ?, ?, UTC_TIMESTAMP(), ?, ?)
    `,
    [user.id, hashTokenId(tokenId), expiresAt ? expiresAt.slice(0, 19).replace('T', ' ') : null, sessionContext.userAgent, sessionContext.ipAddress],
  );

  return {
    user: toSafeUser(user),
    accessToken,
    expiresAt,
  };
}

module.exports = {
  issueAuthSession,
};
