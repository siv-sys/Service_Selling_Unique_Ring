const app = require('./app');
const { initializeCoreTables, ping } = require('./config/db');
const { initializeSocketIO } = require('./utils/socket');

async function startServer() {
  let dbReady = false;

  try {
    await ping();
    await initializeCoreTables();
    dbReady = true;
  } catch (error) {
    console.warn(`⚠️ Database startup check failed: ${error.message}`);
    console.warn('Server will still start, but DB features may fail.');
  }

  app.locals.dbReady = dbReady;

  // ✅ MUST use Railway PORT
  const port = process.env.PORT || 3000;

  const server = app.listen(port, '0.0.0.0', () => {
    app.locals.port = port;

    initializeSocketIO(server);

    console.log(`✅ Server running on port ${port}`);
    console.log(`Database status: ${dbReady ? 'connected' : 'disconnected'}`);
  });

  server.on('error', (error) => {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error('❌ Fatal startup error:', error);
  process.exit(1);
});