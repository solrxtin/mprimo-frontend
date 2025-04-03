import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

export class SocketService {
  private io: SocketServer;

  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle joining a room
      socket.on('join_room', (room: string) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
      });

      // Handle leaving a room
      socket.on('leave_room', (room: string) => {
        socket.leave(room);
        console.log(`User ${socket.id} left room: ${room}`);
      });

      // Handle custom messages
      socket.on('message', (data: { room?: string; message: any }) => {
        if (data.room) {
          // Send to specific room
          socket.to(data.room).emit('message', data.message);
        } else {
          // Broadcast to all except sender
          socket.broadcast.emit('message', data.message);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Method to emit events to all clients
  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Method to emit events to a specific room
  public emitToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }

  // Method to emit events to a specific client
  public emitToClient(socketId: string, event: string, data: any): void {
    this.io.to(socketId).emit(event, data);
  }
}

