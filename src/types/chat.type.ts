import mongoose from "mongoose";


export interface Chat {
  participants: [
    {
      userId: mongoose.Schema.Types.ObjectId;
      role: string;
    }
  ];
  messages: [
    {
        senderId: mongoose.Schema.Types.ObjectId;
        content: string;
        type: 'text' | 'image' | 'file';
        fileUrl: string;
        readBy: mongoose.Schema.Types.ObjectId;
        createdAt: Date;
    }
  ];
  status: "sent" | "delivered" | "read";
  lastMessageAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
