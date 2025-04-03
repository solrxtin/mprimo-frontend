import mongoose from "mongoose";
import {Payment} from "../types/payment.type";

const paymentSchema = new mongoose.Schema<Payment>({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    currency: String,
    method: String,
    gateway: String,
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'] },
    transactionId: String,
    refundDetails: {
      amount: Number,
      reason: String,
      status: String,
      date: Date
    }
}, {timestamps: true});

const Payment = mongoose.model<Payment>("Payment", paymentSchema);

export default Payment;