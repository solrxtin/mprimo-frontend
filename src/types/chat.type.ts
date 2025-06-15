import mongoose, {Types} from "mongoose";


export interface Chat {
  participants: [
    {
      userId: Types.ObjectId;
      role: string;
    }
  ];
  messages: [
    {
        senderId: Types.ObjectId;
        content: string;
        type: 'text' | 'image' | 'file';
        fileUrl: string;
        readBy: Types.ObjectId;
        createdAt: Date;
    }
  ];
  status: "sent" | "delivered" | "read";
  lastMessageAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
