const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function parseRole(role) {
  const normalizedRole = String(role || '').trim().toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'user' ? normalizedRole : null;
}

function normalizeRole(role) {
  return parseRole(role) || 'user';
}

function toSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    role: normalizeRole(user.role),
    provider: user.provider || null,
  };
}

function hashTokenId(tokenId) {
  return crypto.createHash('sha256').update(String(tokenId)).digest('hex');
}

function extractBearerToken(authorizationHeader) {
  const headerValue = String(authorizationHeader || '').trim();
  if (!headerValue.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = headerValue.slice(7).trim();
  return token || null;
}

function signAccessToken(payload) {
  return jwt.sign(payload, env.auth.jwtSecret, {
    expiresIn: env.auth.accessTokenTtl,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.auth.jwtSecret);
}

function getExpiresAtFromToken(token) {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== 'object' || typeof decoded.exp !== 'number') {
    return null;
  }

  return new Date(decoded.exp * 1000).toISOString();
}

function getSessionContext(req) {
  const forwardedFor = String(req.header('x-forwarded-for') || '')
    .split(',')
    .map((part) => part.trim())
    .find(Boolean);

  return {
    userAgent: String(req.header('user-agent') || '').slice(0, 255) || null,
    ipAddress: (forwardedFor || req.ip || req.socket?.remoteAddress || '').slice(0, 45) || null,
  };
}

module.exports = {
  extractBearerToken,
  getExpiresAtFromToken,
  getSessionContext,
  hashTokenId,
  parseRole,
  normalizeRole,
  signAccessToken,
  toSafeUser,
  verifyAccessToken,
};
