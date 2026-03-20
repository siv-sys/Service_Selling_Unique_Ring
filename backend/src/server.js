const app = require('./app');
const env = require('./config/env');
const { initializeCoreTables, ping } = require('./config/db');
const { initializeSocketIO } = require('./utils/socket');

function listenOnAvailablePort(startPort, retriesLeft = 10) {
  return new Promise((resolve, reject) => {
    const server = app.listen(startPort, () => {
      resolve({ server, port: startPort });
    });

    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE' && retriesLeft > 0) {
        console.warn(`Port ${startPort} is already in use. Trying ${startPort + 1}...`);
        server.close(() => {});
        resolve(listenOnAvailablePort(startPort + 1, retriesLeft - 1));
        return;
      }

      reject({ error, port: startPort });
    });
  });
}

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

  const { server, port } = await listenOnAvailablePort(env.port);
  app.locals.port = port;

  // Initialize Socket.IO
  const io = initializeSocketIO(server);

  console.log(`Backend running at http://localhost:${port}`);
  if (port !== env.port) {
    console.log(`Preferred port ${env.port} was busy, so the server started on ${port}.`);
  }
  console.log(`Database: ${env.db.database}`);
  console.log(`Database status: ${dbReady ? 'connected' : 'disconnected'}`);
  console.log(`Socket.IO status: initialized`);

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use.`);
    } else if (error.code === 'EACCES') {
      console.error(`Insufficient permission for port ${port}.`);
    } else {
      console.error('Server startup error:', error.message);
    }
    process.exit(1);
  });
}

startServer().catch((error) => {
  if (error?.error?.code === 'EADDRINUSE') {
    console.error(`Fatal startup error: no free port found starting from ${error.port}.`);
  } else if (error?.error?.code === 'EACCES') {
    console.error(`Fatal startup error: insufficient permission for port ${error.port}.`);
  } else {
    console.error('Fatal startup error:', error?.error || error);
  }
  process.exit(1);
});
