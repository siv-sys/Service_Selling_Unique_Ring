import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

interface UseSocketOptions {
  userId?: number;
  onNotification?: (data: unknown) => void;
  onConnectionEstablished?: (data: unknown) => void;
}

let sharedSocket: Socket | null = null;

export function useSocket(options: UseSocketOptions = {}) {
  const { userId, onNotification, onConnectionEstablished } = options;

  useEffect(() => {
    if (!userId) {
      if (sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    sharedSocket = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join_user_room', userId);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connected', (data) => {
      console.log('Joined room:', data);
    });

    if (onNotification) {
      socket.on('notification', onNotification);
    }

    if (onConnectionEstablished) {
      socket.on('connection_established', onConnectionEstablished);
    }

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      if (sharedSocket === socket) {
        sharedSocket = null;
      }
    };
  }, [userId, onNotification, onConnectionEstablished]);

  return sharedSocket;
}

export function getSocket(): Socket | null {
  return sharedSocket;
}

export default useSocket;
