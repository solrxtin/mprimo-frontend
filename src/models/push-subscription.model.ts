import mongoose from "mongoose";

export interface IPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceId: string;
  userId?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  lastUpdated: Date;
}

const pushSubscriptionSchema = new mongoose.Schema<IPushSubscription>({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  userId: { type: String },
  deviceId: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  userAgent: { type: String },
}, { timestamps: true });

export const PushSubscription = mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);