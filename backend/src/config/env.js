
<<<<<<< HEAD
=======
<<<<<<< HEAD
const dotenv = require('dotenv');

dotenv.config();

function readNumber(value, fallback) {
=======
<<<<<<< HEAD
>>>>>>> feature/ringInventory
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function toNumber(value, fallback) {
<<<<<<< HEAD
=======
>>>>>>> feature/ringInventory
>>>>>>> feature/ringInventory
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

<<<<<<< HEAD
const env = {
  port: toNumber(process.env.PORT, 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: toNumber(process.env.DB_PORT, 3306),
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'ring_app',
  dbConnectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT, 10),
};

module.exports = env;
=======
<<<<<<< HEAD
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: readNumber(process.env.PORT, 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: readNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'ring_app',
    connectionLimit: readNumber(process.env.DB_CONNECTION_LIMIT, 10),
  },
};

module.exports = { env };
=======
module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ring_app',
    connectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT, 10),
  },
};
=======
const dotenv = require('dotenv');

dotenv.config();

function getEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return fallback;
  }
  return value;
}

const env = {
  port: Number(getEnv('PORT', 4000)),
  frontendOrigin: getEnv('FRONTEND_ORIGIN', 'http://localhost:5173'),
  db: {
    host: getEnv('DB_HOST', '127.0.0.1'),
    port: Number(getEnv('DB_PORT', 3306)),
    user: getEnv('DB_USER', 'root'),
    password: getEnv('DB_PASSWORD', ''),
    database: getEnv('DB_NAME', 'ring_app'),
    connectionLimit: Number(getEnv('DB_CONNECTION_LIMIT', 10)),
  },
};

module.exports = env;
>>>>>>> feature/admin_dashboard
>>>>>>> feature/ringInventory
>>>>>>> feature/ringInventory
