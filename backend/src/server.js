
const app = require('./app');
const env = require('./config/env');
const { initializeSettingsTables } = require('./config/db');

async function startServer() {
  try {
    await initializeSettingsTables();
    app.listen(env.port, () => {
      console.log(`Backend running at http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

void startServer();
