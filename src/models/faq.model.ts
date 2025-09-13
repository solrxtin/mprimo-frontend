import mongoose, { Document, Types } from "mongoose";

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  viewCount: number;
  createdBy: Types.ObjectId;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const faqSchema = new mongoose.Schema<IFAQ>({
  question: {
    type: String,
    required: true,
    maxlength: 300
  },
  answer: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  tags: [String],
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft"
  },
  viewCount: {
    type: Number,
    default: 0
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

const FAQ = mongoose.model<IFAQ>("FAQ", faqSchema);
export default FAQ;