import mongoose, { Document, Types } from "mongoose";

export interface IPaymentOption extends Document {
    name: string;
}

const paymentOptionSchema = new mongoose.Schema<IPaymentOption>(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const PaymentOption = mongoose.model<IPaymentOption>("PaymentOption", paymentOptionSchema);

export default PaymentOption;