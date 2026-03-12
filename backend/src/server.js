const app = require('./app');
const env = require('./config/env');
const { initializeSettingsTables, ping } = require('./config/db');

async function startServer() {
  try {
    // Test database connection
    await ping();
    console.log('Database connected successfully');
    
    // Initialize settings tables
    await initializeSettingsTables();
    console.log('Settings tables initialized');
    
    // Start server
    app.listen(env.port, () => {
      console.log(`Backend server running on http://localhost:${env.port}`);
      console.log(`API available at http://localhost:${env.port}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
