import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  name: 'Starter' | 'Pro' | 'Elite';
  productListingLimit: number;
  featuredProductSlots: number;
  analyticsDashboard: boolean;
  customStoreBranding: 'none' | 'basic' | 'premium';
  messagingTools: 'basic' | 'full' | 'full_priority';
  bulkUpload: boolean;
  payoutOptions: string[];
  adCreditMonthly: number;
  prioritySupport: 'none' | 'basic' | 'premium';
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  name: {
    type: String,
    enum: ['Starter', 'Pro', 'Elite'],
    required: true,
    unique: true
  },
  productListingLimit: {
    type: Number,
    required: true
  },
  featuredProductSlots: {
    type: Number,
    default: 0
  },
  analyticsDashboard: {
    type: Boolean,
    default: false
  },
  customStoreBranding: {
    type: String,
    enum: ['none', 'basic', 'premium'],
    default: 'none'
  },
  messagingTools: {
    type: String,
    enum: ['basic', 'full', 'full_priority'],
    default: 'basic'
  },
  bulkUpload: {
    type: Boolean,
    default: false
  },
  payoutOptions: {
    type: [String],
    enum: ['weekly', 'bi-weekly', 'instant'],
    default: ['weekly']
  },
  adCreditMonthly: {
    type: Number,
    default: 0
  },
  prioritySupport: {
    type: String,
    enum: ['none', 'basic', 'premium'],
    default: 'none'
  }
}, { timestamps: true });

export default mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);