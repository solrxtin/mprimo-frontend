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
  userSockets = new Map<string, Set<string>>();

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

      socket.on("authenticate", ({ userId }) => {
        const uid = userId.toString();
        if (!this.userSockets.has(uid)) {
          this.userSockets.set(uid, new Set());
        }
        this.userSockets.get(uid)?.add(socket.id);
      });

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

      socket.on("join-chat", async(payload) => {
        const {userId, chatId, product } = payload;
        let newChat =null;
        const isReceiverOnline = this.userSockets.has(product.vendorId.userId.toString());
        if (!chatId ) {
          newChat = await Chat.create({
            participants: [
              userId,
              product.vendorId.userId,
            ],
            productId: product._id,
            archivedBy: new Map(),
          })
          socket.join(newChat._id.toString());
          socket.emit("chat-joined", { chatId: newChat._id });
          socket.emit("isOnline", isReceiverOnline)
        } else {
          socket.join(chatId);
          socket.emit("chat-joined", { chatId });
          socket.emit("isOnline", isReceiverOnline)
        }
      })

      // Handle custom messages
      socket.on("send_message", async (payload) => {
        const { senderId, receiverId, message, chatId } = payload;
      
        try {
          if (!chatId) return
          if (!senderId || !receiverId || !message) {
            this.emitToRoom(chatId, "error", { message: "Missing required fields" });
            return;
          }
      
          const isFlagged = containsSensitiveInfo(message);
          const flaggedReason = isFlagged ? "Contains sensitive information" : "";
      
          const chat = await Chat.findById(chatId);
          const isChatArchivedByReceiver = chat?.archivedBy?.get(receiverId.toString()) === true;
          const isReceiverOnline = this.userSockets.has(receiverId.toString());
          const io = this.getIO();
      
          if (isFlagged) {
            console.log(`Message flagged: ${message}`);
            this.emitToRoom(chatId, "messageFlagged", { flaggedReason });
          }
      
          const newMessage = {
            chatId,
            senderId,
            receiverId,
            text: message,
            isFlagged,
            flaggedReason,
            read: false,
          };
      
          const persistedMessage = await Message.create(newMessage);
          this.emitToRoom(chatId, "persisted-message", persistedMessage);
      
          if (!isReceiverOnline && !isChatArchivedByReceiver) {
            console.log(`Receiver ${receiverId} is offline, sending notification`);
            const notification: INotification = {
              userId: receiverId,
              title: `New message from ${senderId}`,
              message,
              type: "chat",
              case: "new_message",
              data: {
                redirectUrl: `/chat/${chatId}`,
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

      // socket.on("registerUser", (userId: string) => {
      //   this.userSockets.set(userId, socket.id); // Map User ID to socket ID
      // });

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
        for (const [uid, socketSet] of this.userSockets.entries()) {
          socketSet.delete(socket.id);
          if (socketSet.size === 0) {
            this.userSockets.delete(uid); // optional: treat user as offline
          }
        }      
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
    const socketIdSet = this.userSockets.get(userId);
  
    if (socketIdSet && socketIdSet.size > 0) {
      const socketIds = Array.from(socketIdSet); // Convert Set<string> to string[]
      this.io.to(socketIds).emit(event, { notification });
    } else {
      console.log(`User ${userId} is not online.`);
    }
  }
  

  public notifyUserForOrder(
    userId: any,
    { event, message, order }: { event: string; message: string; order: IOrder }
  ): void {
    const socketIdSet = this.userSockets.get(userId);

    if (socketIdSet && socketIdSet.size > 0) {
      const socketIds = Array.from(socketIdSet); // Convert Set<string> to string[]
      this.io.to(socketIds).emit(event, { message, order });
    } else {
      console.log(`User ${userId} is not online.`);
    }
  }
  getIO() {
    return this.io;
  }
}
