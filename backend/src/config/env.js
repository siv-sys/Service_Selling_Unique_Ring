const dotenv = require('dotenv');
const path = require('path');

const backendRoot = path.resolve(__dirname, '../..');

dotenv.config({
  path: path.join(backendRoot, '.env'),
});

if (process.env.NODE_ENV) {
  dotenv.config({
    path: path.join(backendRoot, `.env.${process.env.NODE_ENV}`),
  });
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || process.env.CLIENT_URL || process.env.FRONTEND_PRODUCTION_URL || '*',
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    accessTokenTtl: process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '12h',
  },
  db: {
    host: process.env.DB_HOST,
    port: toNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT || process.env.DB_POOL_MAX, 10),
    connectTimeout: toNumber(process.env.DB_CONNECTION_TIMEOUT, 60000),
  },
};

module.exports = env;
