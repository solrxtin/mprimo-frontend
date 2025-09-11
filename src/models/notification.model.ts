import mongoose from "mongoose";
import { INotification } from "../types/notification.type";

const notificationSchema = new mongoose.Schema<INotification>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
    },
    case: String,
    title: String,
    message: String,
    data: {
      redirectUrl: String,
      entityId: mongoose.Schema.Types.ObjectId,
      entityType: String,
    },
    isRead: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;
