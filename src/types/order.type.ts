import mongoose, { Types, Document } from "mongoose";
import { IPayment } from "./payment.type";

export interface ItemType {
  productId: Types.ObjectId;
  variantId: string;
  quantity: number;
  price: number;
}

export interface IConfirmationEntry {
  role: "buyer" | "courier";
  confirmedAt: Date;
}

export interface IReceivedItem {
  productId: Types.ObjectId;
  vendorId: Types.ObjectId;
  receivedAt?: Date;
  receivedBy?: Types.ObjectId; 
}

export interface IRejectedItem {
  productId: Types.ObjectId;
  vendorId: Types.ObjectId;
  reason: string;
  explanation: string;
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId; 
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: ItemType[];
  paymentId: Types.ObjectId | IPayment;
  shipping: {
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    carrier: string;
    trackingNumber: string;
    status: "processing" | "shipped" | "delivered" | "returned";
    estimatedDelivery: Date;
    type: "normal" | "go-fast" | "go-faster";
  };
  status:
    | "pending"
    | "paid"
    | "shippedToWarehouse"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  cancellationReason?: string;
  cancelledAt?: Date;
  confirmations?: IConfirmationEntry[];
  receivedItems: IReceivedItem[];
  rejectedItems: IRejectedItem[];
  refund?: {
    amount: number;
    reason: string;
    method: "original" | "store_credit" | "manual";
    status: "pending" | "completed" | "failed";
    transactionId: string;
    processedAt?: Date;
  };
  deliveryMethod: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRefund {
  _id?: Types.ObjectId;
  orderId: Types.ObjectId;
  vendorId: Types.ObjectId;
  amount: number;
  reason?: string;
  processedBy: Types.ObjectId;
  processedAt: Date;
  status: "pending" | "processed" | "failed";
}
