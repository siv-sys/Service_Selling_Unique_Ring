<<<<<<< HEAD
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '12h',
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ring_app',
    connectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT, 10),
  },
};

module.exports = env;
=======
﻿
>>>>>>> integration_branch
