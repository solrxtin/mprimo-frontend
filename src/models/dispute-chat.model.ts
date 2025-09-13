import mongoose, { Document, Types } from "mongoose";

export interface IDisputeChat extends Document {
  issueId: Types.ObjectId;
  participants: Types.ObjectId[];
  status: "active" | "closed";
  lastMessageTime: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDisputeMessage extends Document {
  disputeChatId: Types.ObjectId;
  senderId: Types.ObjectId;
  text?: string;
  messageType: "text" | "image" | "video" | "document";
  attachment?: {
    url: string;
    publicId: string;
    fileName?: string;
    fileSize?: number;
  };
  readBy: Map<string, Date>;
  createdAt?: Date;
  updatedAt?: Date;
}

const disputeChatSchema = new mongoose.Schema<IDisputeChat>({
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Issue",
    required: true,
    unique: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  status: {
    type: String,
    enum: ["active", "closed"],
    default: "active"
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const disputeMessageSchema = new mongoose.Schema<IDisputeMessage>({
  disputeChatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DisputeChat",
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    maxlength: 3000
  },
  messageType: {
    type: String,
    enum: ["text", "image", "video", "document"],
    default: "text"
  },
  attachment: {
    url: String,
    publicId: String,
    fileName: String,
    fileSize: Number
  },
  readBy: {
    type: Map,
    of: Date,
    default: {}
  }
}, {
  timestamps: true
});

export const DisputeChat = mongoose.model<IDisputeChat>("DisputeChat", disputeChatSchema);
export const DisputeMessage = mongoose.model<IDisputeMessage>("DisputeMessage", disputeMessageSchema);