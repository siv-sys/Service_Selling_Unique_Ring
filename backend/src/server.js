const app = require('./app');
const env = require('./config/env');
const { initializeCoreTables, ping } = require('./config/db');
const { initializeSocketIO } = require('./utils/socket');

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

  const port = env.port;
  const server = app.listen(port, () => {
    app.locals.port = port;

    // Initialize Socket.IO only after the HTTP server is listening.
    initializeSocketIO(server);

    console.log(`Backend running at http://localhost:${port}`);
    console.log(`Database: ${env.db.database}`);
    console.log(`Database status: ${dbReady ? 'connected' : 'disconnected'}`);
    console.log('Socket.IO status: initialized');
  });

  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the old backend process and restart.`);
    } else if (error.code === 'EACCES') {
      console.error(`Insufficient permission for port ${port}.`);
    } else {
      console.error('Server startup error:', error.message);
    }
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error('Fatal startup error:', error?.error || error);
  process.exit(1);
});
