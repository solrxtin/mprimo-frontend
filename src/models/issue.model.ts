import mongoose, { Document, Types } from "mongoose";
import { createDisputeChat } from "../controllers/dispute-chat.controller";

export interface IIssue extends Document {
  caseId: string;
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  reason: string;
  description?: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  assignedTo?: Types.ObjectId;
  resolution?: string;
  resolvedAt?: Date;
  chatId?: Types.ObjectId;
  evidenceUrls?: string[];
  returnOutcome?: "refund" | "product_replacement";
  createdAt?: Date;
  updatedAt?: Date;
}

const issueSchema = new mongoose.Schema<IIssue>(
  {
    caseId: {
      type: String,
      unique: true,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "Product Defective",
        "Wrong Item Received",
        "Missing Items",
        "Damaged Package",
        "Late Delivery",
        "Poor Quality",
        "Not as Described",
        "Other"
      ],
    },
    description: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolution: {
      type: String,
      maxlength: 1000,
    },
    resolvedAt: {
      type: Date,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DisputeChat",
    },
    evidenceUrls: {
      type: [String],
      default: [],
    },
    returnOutcome: {
      type: String,
      enum: ["refund", "product_replacement"],
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique case ID
issueSchema.pre("save", async function (next) {
  if (!this.caseId) {
    const count = await mongoose.model("Issue").countDocuments();
    this.caseId = `CASE-${Date.now()}-${(count + 1).toString().padStart(4, "0")}`;
  }
  next();
});

// Auto-create dispute chat
issueSchema.post("save", async function (doc) {
  if (doc.isNew && !doc.chatId) {
    const participants = [doc.userId];
    if (doc.assignedTo) participants.push(doc.assignedTo);
    
    try {
      await createDisputeChat(doc._id.toString(), participants.map(p => p.toString()));
    } catch (error) {
      console.error("Error creating dispute chat:", error);
    }
  }
});

const Issue = mongoose.model<IIssue>("Issue", issueSchema);

export default Issue;