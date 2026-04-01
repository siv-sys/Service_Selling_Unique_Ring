import { useEffect } from 'react';
<<<<<<< HEAD:frontend/src/hooks/useSocket.ts
import { io, type Socket } from 'socket.io-client';
=======
import { io, Socket } from 'socket.io-client';
>>>>>>> deployment:frontend/hooks/useSocket.ts

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
let activeSocket: Socket | null = null;

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

<<<<<<< HEAD:frontend/src/hooks/useSocket.ts
=======
    activeSocket = socket;

    // Cleanup on unmount
>>>>>>> deployment:frontend/hooks/useSocket.ts
    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      if (sharedSocket === socket) {
        sharedSocket = null;
      }
      if (activeSocket === socket) {
        activeSocket = null;
      }
    };
  }, [userId, onNotification, onConnectionEstablished]);

<<<<<<< HEAD:frontend/src/hooks/useSocket.ts
  return sharedSocket;
=======
  return activeSocket;
>>>>>>> deployment:frontend/hooks/useSocket.ts
}

export function getSocket(): Socket | null {
<<<<<<< HEAD:frontend/src/hooks/useSocket.ts
  return sharedSocket;
=======
  return activeSocket;
>>>>>>> deployment:frontend/hooks/useSocket.ts
}

export default useSocket;
