import mongoose from "mongoose";
import {Notification} from "../types/notification.type"

const notificationSchema = new mongoose.Schema<Notification>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['order', 'payment', 'promotion', 'system', 'chat'] },
    title: String,
    message: String,
    data: {
      redirectUrl: String,
      entityId: mongoose.Schema.Types.ObjectId,
      entityType: String
    },
    isRead: Boolean,
  }, {timestamps: true})

const Notification = mongoose.model<Notification>('Notification', notificationSchema);

export default Notification;