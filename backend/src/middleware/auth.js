// Simple auth middleware for development (no JWT required)
const authenticate = (req, res, next) => {
  // For development, just set a mock user
  req.userId = 1;
  req.userRole = 'user';
  next();
};

const isAdmin = (req, res, next) => {
  // For development, allow all users
  next();
};

module.exports = { authenticate, isAdmin };