import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useUserStore } from '@/stores/useUserStore';
import socketService from '@/utils/socketService';

/**
 * Hook to access the socket instance
 * @returns The socket instance or null if not connected
 */
export const useSocket = (): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useUserStore();
  
  useEffect(() => {
    if (user?._id) {
      // Get or create socket connection
      const socketInstance = socketService.connect(user._id);
      setSocket(socketInstance);
    } else {
      setSocket(null);
    }
  }, [user?._id]);
  
  return socket;
};