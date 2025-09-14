import mongoose from "mongoose";
import { IChat, IMessage } from "../types/chat.type";


const chatSchema = new mongoose.Schema<IChat>({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  ],
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  archivedBy: {
    type: Map,
    of: Boolean,
    default: {}
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});


const messageSchema = new mongoose.Schema<IMessage>({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: function() { return !this.attachments || this.attachments.length === 0; }
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: { type: String, enum: ['image', 'document', 'video', 'audio'] },
    fileSize: Number,
    mimeType: String,
    scanResult: {
      safe: { type: Boolean, default: true },
      threats: [String]
    }
  }],
  messageType: {
    type: String,
    enum: ['text', 'file'],
    default: 'text'
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flaggedReason: String,
  read: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true
});

export const Chat = mongoose.model<IChat>("Chat", chatSchema);
export const Message = mongoose.model<IMessage>("Message", messageSchema);