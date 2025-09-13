import mongoose, {Types} from "mongoose";

export interface IPayment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
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