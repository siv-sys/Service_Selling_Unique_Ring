const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const loginRoutes = require('./routes/login.routes');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'API server is running.',
    endpoints: ['/api/health', '/api/login', '/api/login/google', '/api/auth/register', '/api/auth/me', '/api/auth/logout', '/api/auth/reset-password'],
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
