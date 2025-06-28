import mongoose from "mongoose";
import {INotification} from "../types/notification.type"

const notificationSchema = new mongoose.Schema<INotification>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {type: String, enum: ['order', 'payment', 'promotion', 'system', 'chat', 'offer', 'bid']},
    case: String,
    title: String,
    message: String,
    data: {
      redirectUrl: String,
      entityId: mongoose.Schema.Types.ObjectId,
      entityType: String
    },
    isRead: Boolean,
  }, {timestamps: true})

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;