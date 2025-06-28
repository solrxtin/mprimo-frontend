import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { IOrder } from '../types/order.type';
import { Types } from 'mongoose';
import { INotification } from '../types/notification.type';

export class SocketService {
  private io: SocketServer;
  vendorSockets = new Map();
  userSockets = new Map(); 

  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: ["http://localhost:3000"],
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

      socket.on("registerVendor", (vendorId: string) => {
        this.vendorSockets.set(vendorId, socket.id); // Map vendor ID to socket ID
        console.log(`Vendor ${vendorId} registered with socket ID: ${socket.id}`);
      });

      socket.on("registerUser", (userId: string) => {
        this.userSockets.set(userId, socket.id); // Map vendor ID to socket ID
      });

      socket.onAny((event, ...args) => {
        console.log("Received event:", event, args);
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        // Remove vendor from map on disconnect
        this.vendorSockets.forEach((value, key) => {
          if (value === socket.id) {
            this.vendorSockets.delete(key);
          }
        });
        // Remove user from map on disconnect
        this.userSockets.forEach((value, key) => {
          if (value === socket.id) {
            this.userSockets.delete(key);
          }
        });
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

  public notifyVendor(vendorId: Types.ObjectId, {event, notification}: {event: string; notification: INotification}): void {
    const vendorSocketId = this.vendorSockets.get(vendorId);
    if (vendorSocketId) {
      this.io.to(vendorSocketId).emit(event, { notification });
    } else {
      console.log(`Vendor ${vendorId} is not online.`);
    }
  }

  public notifyUser(userId: string, {event, notification}: {event: string; notification: INotification}): void {
    const userSocketId = this.userSockets.get(userId);
    if (userSocketId) {
      this.io.to(userSocketId).emit(event, { notification });
    } else {
      console.log(`User ${userId} is not online.`);
    }
  }

  public notifyUserForOrder(userId: any, { event, message, order }: { event: string; message: string; order: IOrder }): void {
    const userSocketId = this.userSockets.get(userId);
    if (userSocketId) {
      this.io.to(userSocketId).emit(event, { message, order });
    } else {
      console.log(`User ${userId} is not online.`);
    }
  }
  getIO() {
    return this.io
  }
}

