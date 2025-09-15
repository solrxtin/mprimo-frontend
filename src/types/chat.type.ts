import { Types, Document } from "mongoose";

export interface IChat extends Document {
  participants: Types.ObjectId[]; // Array of user IDs
  productId: Types.ObjectId
  archivedBy: Map<string, boolean>;
  lastMessageTime: Date;
  createdAt: Date;
  updatedAt: Date;
}


export interface IMessage extends Document {
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  text?: string;
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType: 'image' | 'document' | 'video' | 'audio';
    fileSize: number;
    mimeType: string;
    scanResult: {
      safe: boolean;
      threats: string[];
    };
  }[];
  messageType: 'text' | 'file';
  isFlagged: boolean;
  flaggedReason?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

