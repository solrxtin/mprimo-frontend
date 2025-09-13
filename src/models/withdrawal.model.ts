import mongoose, { Document, Types } from "mongoose";

export interface IWithdrawal extends Document {
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  amountInUSD: number;
  method: "bank_transfer" | "stripe" | "crypto";
  accountDetails: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    accountName?: string;
    stripeAccountId?: string;
    cryptoAddress?: string;
  };
  status: "pending" | "approved" | "rejected" | "completed" | "failed";
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  rejectionReason?: string;
  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const withdrawalSchema = new mongoose.Schema<IWithdrawal>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    required: true
  },
  amountInUSD: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ["bank_transfer", "stripe", "crypto"],
    required: true
  },
  accountDetails: {
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    accountName: String,
    stripeAccountId: String,
    cryptoAddress: String
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed", "failed"],
    default: "pending"
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  processedAt: Date,
  rejectionReason: String,
  transactionId: String
}, {
  timestamps: true
});

const Withdrawal = mongoose.model<IWithdrawal>("Withdrawal", withdrawalSchema);

export default Withdrawal;