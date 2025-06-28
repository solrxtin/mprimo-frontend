import { Types, Document } from "mongoose";

export interface IChat extends Document {
  participants: Types.ObjectId[]; // Array of user IDs
  productId: Types.ObjectId
  archivedBy: Map<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}


export interface IMessage extends Document {
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  text: string;
  isFlagged: boolean;
  flaggedReason?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

