import mongoose from "mongoose";
import { Chat } from "../types/chat.type";


const chatSchema = new mongoose.Schema<Chat>({
    participants: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: String
    }],
    messages: [{
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      content: String,
      type: { type: String, enum: ['text', 'image', 'file'] },
      fileUrl: String,
      readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      createdAt: Date
    }],
    status: { type: String, enum: ['sent', 'delivered', 'read'] },
    lastMessageAt: Date,
}, {timestamps: true})

const Chat = mongoose.model<Chat>('Chat', chatSchema);

export default Chat;