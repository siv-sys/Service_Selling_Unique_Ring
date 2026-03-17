const app = require('./app');
const env = require('./config/env');
const { ping } = require('./config/db');

async function start() {
  try {
    await ping();
    app.listen(env.port, () => {
      console.log(`Backend server running on http://localhost:${env.port}`);
      console.log('Database connected successfully');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
