
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
