const app = require('./app');
const { initializeCoreTables, ping } = require('./config/db');
const { initializeSocketIO } = require('./utils/socket');

let dbInitPromise = null;

async function ensureDatabaseInitialized() {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
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
      return dbReady;
    })();
  }

  return dbInitPromise;
}

async function startServer() {
  await ensureDatabaseInitialized();

  const port = process.env.PORT || 3000;

  const server = app.listen(port, '0.0.0.0', () => {
    app.locals.port = port;

    initializeSocketIO(server);

    console.log(`✅ Server running on port ${port}`);
    console.log(`Database status: ${app.locals.dbReady ? 'connected' : 'disconnected'}`);
  });

  server.on('error', (error) => {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  });
}

if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    try {
      await ensureDatabaseInitialized();
    } catch (error) {
      console.warn('⚠️ Database init failed in serverless handler:', error.message);
    }

    return app(req, res);
  };
} else {
  startServer().catch((error) => {
    console.error('❌ Fatal startup error:', error);
    process.exit(1);
  });

  module.exports = app;
}