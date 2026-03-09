<<<<<<< HEAD
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
=======
<<<<<<< HEAD
﻿
const app = require('./app');
const env = require('./config/env');
const { initializeSettingsTables } = require('./config/db');

async function startServer() {
  try {
    await initializeSettingsTables();
    app.listen(env.port, () => {
      console.log(`Backend running at http://localhost:${env.port}`);
=======
<<<<<<< HEAD
﻿
const app = require('./app.js');
const { env } = require('./config/env.js');

app.listen(env.port, () => {
  console.log(`Backend server running on http://localhost:${env.port}`);
});
=======
<<<<<<< HEAD
﻿
const app = require('./app');
const env = require('./config/env');
const { ping } = require('./config/db');

async function start() {
  try {
    await ping();
    app.listen(env.port, () => {
      console.log(`API running on http://localhost:${env.port}`);
>>>>>>> feature/ringInventory
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

<<<<<<< HEAD
void startServer();
=======
start();
=======
const app = require('./app');
const env = require('./config/env');

const port = env.port;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
>>>>>>> feature/admin_dashboard
>>>>>>> feature/ringInventory
>>>>>>> feature/ringInventory
>>>>>>> feature/ringInventory
