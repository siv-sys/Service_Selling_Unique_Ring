const socketIO = require('socket.io');

let io;

function initializeSocketIO(server) {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Store io instance globally for access from routes
  global.io = io;

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // User joins their personal room
    socket.on('join_user_room', (userId) => {
      const roomName = `user_${userId}`;
      socket.join(roomName);
      console.log(`User ${userId} joined room: ${roomName}`);
      
      // Send confirmation
      socket.emit('connected', { userId, roomId: roomName });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔌 User disconnected:', socket.id);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
}

// Helper function to emit events to specific user
function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
}

// Broadcast to all users
function broadcastToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = {
  initializeSocketIO,
  emitToUser,
  broadcastToAll
};
