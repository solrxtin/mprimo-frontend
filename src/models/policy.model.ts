import mongoose, { Document, Types } from "mongoose";

export interface IPolicy extends Document {
  title: string;
  category: "legal" | "operational" | "shipping" | "returns" | "privacy";
  content: string;
  status: "draft" | "published" | "archived";
  createdBy: Types.ObjectId;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const policySchema = new mongoose.Schema<IPolicy>({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  category: {
    type: String,
    enum: ["legal", "operational", "shipping", "returns", "privacy", "terms and conditions"],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  publishedAt: Date
}, {
  timestamps: true
});

const Policy = mongoose.model<IPolicy>("Policy", policySchema);
export default Policy;