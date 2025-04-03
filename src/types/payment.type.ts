import mongoose from "mongoose";

export interface Payment {
    _id: mongoose.Schema.Types.ObjectId;
    orderId: mongoose.Schema.Types.ObjectId;
    userId: mongoose.Schema.Types.ObjectId;
    amount: number;
    currency: string;
    method: string;
    gateway: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId: string;
    refundDetails: {
      amount: number;
      reason: string;
      status: string;
      date: Date;
    };
    createdAt?: Date;
    updatedAt?: Date;
  }