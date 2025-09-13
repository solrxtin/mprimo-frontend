import mongoose, { Document, Types } from "mongoose";

export interface IAdminNotification extends Document {
  title: string;
  content: string;
  audience: "all" | "vendors" | "buyers" | "specific";
  targetUsers?: Types.ObjectId[];
  scheduledFor?: Date;
  status: "draft" | "scheduled" | "sent" | "cancelled";
  sentAt?: Date;
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const adminNotificationSchema = new mongoose.Schema<IAdminNotification>({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  audience: {
    type: String,
    enum: ["all", "vendors", "buyers", "specific"],
    required: true
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  scheduledFor: Date,
  status: {
    type: String,
    enum: ["draft", "scheduled", "sent", "cancelled"],
    default: "draft"
  },
  sentAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: true
});

const AdminNotification = mongoose.model<IAdminNotification>("AdminNotification", adminNotificationSchema);
export default AdminNotification;