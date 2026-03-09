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
