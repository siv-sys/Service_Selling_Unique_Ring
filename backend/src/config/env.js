const dotenv = require('dotenv');

dotenv.config(); // ✅ FIXED (no custom path)

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',

  // ✅ MUST support Railway PORT
  port: toNumber(process.env.PORT, 3000),

  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    accessTokenTtl: process.env.JWT_EXPIRE || '12h',
  },

  db: {
    host: process.env.DB_HOST,
    port: toNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT, 10),
  },
};

module.exports = env;