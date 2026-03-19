const app = require('./app');
const env = require('./config/env');
const { initializeCoreTables, ping } = require('./config/db');

async function startServer() {
  let dbReady = false;
  try {
    await ping();
    await initializeCoreTables();
    dbReady = true;
  } catch (error) {
    console.warn(`Database startup check failed: ${error.message}`);
    console.warn('Server will start, but database-backed endpoints may fail until DB config is fixed.');
  }

  app.locals.dbReady = dbReady;

  const server = app.listen(env.port, () => {
    console.log(`Backend running at http://localhost:${env.port}`);
    console.log(`Database: ${env.db.database}`);
    console.log(`Database status: ${dbReady ? 'connected' : 'disconnected'}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${env.port} is already in use.`);
    } else if (error.code === 'EACCES') {
      console.error(`Insufficient permission for port ${env.port}.`);
    } else {
      console.error('Server startup error:', error.message);
    }
    process.exit(1);
  });
}

void startServer();
