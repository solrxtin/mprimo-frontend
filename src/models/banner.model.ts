import mongoose, { Document, Types } from "mongoose";

export interface IBanner extends Document {
  title: string;
  imageUrl: string;
  targetUrl?: string;
  altText?: string;
  position: "header" | "hero" | "sidebar" | "footer";
  status: "draft" | "active" | "inactive" | "scheduled";
  activeImmediately?: boolean;
  startDate?: Date;
  endDate?: Date;
  clickCount: number;
  impressions: number;
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const bannerSchema = new mongoose.Schema<IBanner>({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  imageUrl: {
    type: String,
    required: true
  },
  targetUrl: String,
  altText: String,
  position: {
    type: String,
    enum: ["header", "hero", "sidebar", "footer"],
    required: true
  },
  status: {
    type: String,
    enum: ["draft", "active", "inactive", "scheduled"],
    default: "draft"
  },
  activeImmediately: {
    type: Boolean,
    default: false
  },
  startDate: Date,
  endDate: Date,
  clickCount: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: true
});

const Banner = mongoose.model<IBanner>("Banner", bannerSchema);
export default Banner;