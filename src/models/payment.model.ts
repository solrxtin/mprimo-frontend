import mongoose from "mongoose";
import { IPayment } from "../types/payment.type";

const paymentSchema = new mongoose.Schema<IPayment>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: Number,
    currency: String,
    method: String,
    gateway: String,
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
    },
    transactionId: String,
    refundDetails: {
      amount: Number,
      reason: String,
      status: String,
      date: Date,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);

const vendorPaymentSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  tokenType: {type: String},
  amount: { type: Number, required: true },
  transactionHash: String,
  method: { type: String, enum: ["stripe", "crypto"], required: true },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
}, { timestamps: true });

export const VendorPayment = mongoose.model("VendorPayment", vendorPaymentSchema);

export default Payment;


// return {
//   transactionHash: receipt.hash,
//   blockNumber: receipt.blockNumber,
//   from: wallet.address,
//   to: to,
//   amount: amount,
//   tokenType: tokenType,
// };