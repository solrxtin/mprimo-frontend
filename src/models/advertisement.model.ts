import mongoose, { Document, Types } from "mongoose";

export interface IAdvertisement extends Document {
  vendorId: Types.ObjectId;
  productId: Types.ObjectId;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  adType: "banner" | "featured" | "sponsored";
  duration: number; // days
  cost: number;
  status: "pending" | "approved" | "rejected" | "active" | "expired";
  startDate?: Date;
  endDate?: Date;
  impressions: number;
  clicks: number;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const advertisementSchema = new mongoose.Schema<IAdvertisement>({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 300
  },
  imageUrl: {
    type: String,
    required: true
  },
  targetUrl: {
    type: String,
    required: true
  },
  adType: {
    type: String,
    enum: ["banner", "featured", "sponsored"],
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "active", "expired"],
    default: "pending"
  },
  startDate: Date,
  endDate: Date,
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  reviewedAt: Date,
  rejectionReason: String
}, {
  timestamps: true
});

const Advertisement = mongoose.model<IAdvertisement>("Advertisement", advertisementSchema);
export default Advertisement;