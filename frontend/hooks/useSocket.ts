import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
let activeSocket: Socket | null = null;

interface UseSocketOptions {
  userId?: number;
  onNotification?: (data: any) => void;
  onConnectionEstablished?: (data: any) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { userId, onNotification, onConnectionEstablished } = options;

  useEffect(() => {
    if (!userId) return;

    // Initialize Socket.IO connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      
      // Join user's personal room
      socket.emit('join_user_room', userId);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connected', (data) => {
      console.log('🏠 Joined room:', data);
    });

    // Listen for notifications
    if (onNotification) {
      socket.on('notification', onNotification);
    }

    // Listen for connection established events
    if (onConnectionEstablished) {
      socket.on('connection_established', onConnectionEstablished);
    }

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    activeSocket = socket;

    // Cleanup on unmount
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
      if (activeSocket === socket) {
        activeSocket = null;
      }
    };
  }, [userId, onNotification, onConnectionEstablished]);

  return activeSocket;
}

// Helper function to get socket instance
export function getSocket(): Socket | null {
  return activeSocket;
}

export default useSocket;
