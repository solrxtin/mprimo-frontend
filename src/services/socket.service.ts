import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { IOrder } from "../types/order.type";
import mongoose, { Types } from "mongoose";
import { INotification } from "../types/notification.type";
import { Chat, Message } from "../models/chat.model";
import { IMessage } from "../types/chat.type";
import Notification from "../models/notification.model";

const SENSITIVE_PATTERNS: Record<string, RegExp> = {
  // Matches most phone formats: +1 123-456-7890, (123) 456-7890, 123.456.7890, etc.
  phone:
    /\b(?:\+?\d{1,4}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}\b/g,

  // Standard email format (case-insensitive)
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi,

  // URLs: http/https, with optional www and proper domain matching
  url: /\b(?:https?:\/\/|www\.)[^\s]+\.[^\s]{2,}\b/gi,

  // Social media usernames or mentions
  social:
    /\b(@\w{2,}|snap[:]? ?\w+|ig[:]? ?\w+|whatsapp[:]? ?\w+|t\.me\/\w+|facebook\.com\/\w+|x\.com\/\w+)\b/gi,

  // Risky expressions that imply off-platform contact
  riskyWords:
    /\b(call me|text me|dm me|reach me|whatsapp me|telegram me|inbox me|email me|send your number|drop your contact|let's connect outside)\b/gi,
};

function containsSensitiveInfo(message: string): boolean {
  return Object.values(SENSITIVE_PATTERNS).some((pattern) =>
    pattern.test(message)
  );
}

export class SocketService {
  private io: SocketServer;
  vendorSockets = new Map();
  userSockets = new Map();

  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle joining a room
      socket.on("join_room", (room: string) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
      });

      // Handle leaving a room
      socket.on("leave_room", (room: string) => {
        socket.leave(room);
        console.log(`User ${socket.id} left room: ${room}`);
      });

      // Handle custom messages
      socket.on("send_message", async (payload) => {
        const { senderId, receiverId, message, chatId, productId } = payload;
        
        try {
          if (!senderId || !receiverId || !message || !productId) {
            this.emitToRoom(productId, "error", { message: "Missing required fields" });
            return;
          }
          const isFlagged = containsSensitiveInfo(message);
          const flaggedReason = isFlagged ? "Contains sensitive information" : "";
          const _id = new mongoose.Types.ObjectId();
          const isChatArchivedByReceiver = await Chat.exists({
            _id: chatId,
            [`archivedBy.${receiverId.toString()}`]: true
          });
          const isReceiverOnline = this.userSockets.has(receiverId);
          const io = this.getIO();

          if (isFlagged) {
            console.log(`Message flagged: ${message}`);
            this.emitToRoom(chatId, "messageFlagged", {flaggedReason});
          }

          let newMessage = {
            _id,
            chatId,
            senderId,
            receiverId,
            text: message,
            isFlagged,
            flaggedReason,
            read: false,
          };

          if (chatId) {
            console.log(`Sending message in existing chat: ${chatId}`);

            if (!isFlagged) {
              this.emitToRoom(chatId, "message", newMessage);
            }

            const persistedMessage = await Message.create(newMessage);
            this.emitToRoom(chatId, "persisted-message", persistedMessage);
          } else {
            console.log(`Creating new chat for product: ${productId}`);
            const chatId = new mongoose.Types.ObjectId();
            
            newMessage = {
              ...newMessage,
              chatId,
            };

            this.emitToRoom(chatId.toString(), "message", newMessage);

            const newChat = {
              _id: chatId,
              participants: [
                senderId,
                receiverId,
              ],
              productId,
              archivedBy: new Map(),
            };

            await Chat.create(newChat);
            const persistedMessage = await Message.create(newMessage);
            this.emitToRoom(chatId.toString(), "persisted-message", persistedMessage);
          }

          if (!isReceiverOnline && !isChatArchivedByReceiver) {
            console.log(`Receiver ${receiverId} is offline, sending notification`);
            const notification: INotification = {
              userId: receiverId,
              title: `New message from ${senderId}`,
              message,
              type: "chat",
              case: "new_message",
              data: {
                redirectUrl: `/chat/${chatId}`, // Correct URL to redirect to chat
                entityId: chatId,
                entityType: "chat",
              },
              isRead: false,
              createdAt: new Date(),
            };
            await Notification.create(notification);
          }
        } catch (error) {
          console.error("Error sending message:", error);
          this.emitToRoom(chatId, "error", { message: "Failed to send message" });
        }
      });

      socket.on("registerVendor", (vendorId: string) => {
        this.vendorSockets.set(vendorId, socket.id); // Map vendor ID to socket ID
        console.log(
          `Vendor ${vendorId} registered with socket ID: ${socket.id}`
        );
      });

      socket.on("registerUser", (userId: string) => {
        this.userSockets.set(userId, socket.id); // Map User ID to socket ID
      });

      socket.onAny((event, ...args) => {
        console.log("Received event:", event, args);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
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

  public notifyVendor(
    vendorId: Types.ObjectId,
    { event, notification }: { event: string; notification: INotification }
  ): void {
    const vendorSocketId = this.vendorSockets.get(vendorId);
    if (vendorSocketId) {
      this.io.to(vendorSocketId).emit(event, { notification });
    } else {
      console.log(`Vendor ${vendorId} is not online.`);
    }
  }

  public notifyUser(
    userId: string,
    { event, notification }: { event: string; notification: INotification }
  ): void {
    const userSocketId = this.userSockets.get(userId);
    if (userSocketId) {
      this.io.to(userSocketId).emit(event, { notification });
    } else {
      console.log(`User ${userId} is not online.`);
    }
  }

  public notifyUserForOrder(
    userId: any,
    { event, message, order }: { event: string; message: string; order: IOrder }
  ): void {
    const userSocketId = this.userSockets.get(userId);
    if (userSocketId) {
      this.io.to(userSocketId).emit(event, { message, order });
    } else {
      console.log(`User ${userId} is not online.`);
    }
  }
  getIO() {
    return this.io;
  }
}
