const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.port, () => {
  console.log(`API server listening on http://localhost:${env.port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`API server failed: port ${env.port} is already in use.`);
    console.error('Stop the running process on this port or change PORT in backend/.env.');
    process.exit(1);
  }

  if (error.code === 'EACCES') {
    console.error(`API server failed: insufficient permission to use port ${env.port}.`);
    process.exit(1);
  }

  console.error('API server startup error:', error.message);
  process.exit(1);
});
