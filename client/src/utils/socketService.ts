import { io, Socket } from 'socket.io-client';

/**
 * Socket service to handle Socket.IO connections
 */
class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  // Connect to the Socket.IO server
  public connect(userId: string): Socket {
    if (!this.socket) {
      // Replace with your actual Socket.IO endpoint
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5800';
      
      this.socket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        auth: {
          userId
        }
      });

      this.setupEventHandlers();
    }
    
    return this.socket;
  }

  // Set up default event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });
  }

  // Join a specific room (e.g., for wallet updates)
  public joinRoom(room: string): void {
    if (this.socket) {
      this.socket.emit('join_room', room);
    }
  }

  // Leave a specific room
  public leaveRoom(room: string): void {
    if (this.socket) {
      this.socket.emit('leave_room', room);
    }
  }

  // Disconnect from the Socket.IO server
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get the socket instance
  public getSocket(): Socket | null {
    return this.socket;
  }
}

export default SocketService.getInstance();