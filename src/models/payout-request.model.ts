import mongoose, { Schema, Document } from 'mongoose';

export interface IPayoutRequest extends Document {
  vendor: mongoose.Types.ObjectId;
  amount: number;
  type: 'weekly' | 'bi-weekly' | 'instant';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingFee?: number;
  requestedAt: Date;
  processedAt?: Date;
}

const payoutRequestSchema = new Schema<IPayoutRequest>({
  vendor: { 
    type: Schema.Types.ObjectId, 
    ref: 'Vendor', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: [1, 'Payout amount must be at least 1']
  },
  type: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'instant'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  processingFee: {
    type: Number,
    min: 0
  },
  requestedAt: { 
    type: Date, 
    default: Date.now 
  },
  processedAt: Date,
}, { timestamps: true });

export default mongoose.model<IPayoutRequest>('PayoutRequest', payoutRequestSchema);