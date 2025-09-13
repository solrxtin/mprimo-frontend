
import mongoose, { Schema, Types } from 'mongoose';

interface ITransaction {
  type: 'credit' | 'debit';
  amount: number;
  description?: string;
  date: Date;
  relatedOrder?: Types.ObjectId;
}

export interface IWallet {
  userId: Types.ObjectId;
  currency: string;
  balance: number;
  pending: number;
  transactions: ITransaction[];
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  relatedOrder: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
  },
});

const walletSchema = new Schema<IWallet>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  pending: {
    type: Number,
    default: 0,
  },
  transactions: [transactionSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Wallet = mongoose.model<IWallet>("Wallet", walletSchema);

export default Wallet;