import mongoose, {Types} from "mongoose";

export interface Notification {
    userId: Types.ObjectId;
    title: string;
    type: 'order' | 'payment' | 'promotion' | 'system' | 'chat';
    message: string;
    data: {
        redirectUrl: string;
        entityId: Types.ObjectId;
        entityType: string;
    };
    isRead: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}