import mongoose from "mongoose";

export interface Notification {
    userId: mongoose.Schema.Types.ObjectId;
    title: string;
    type: 'order' | 'payment' | 'promotion' | 'system' | 'chat';
    message: string;
    data: {
        redirectUrl: string;
        entityId: mongoose.Schema.Types.ObjectId;
        entityType: string;
    };
    isRead: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}