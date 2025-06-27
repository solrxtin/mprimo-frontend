import mongoose, {Types} from "mongoose";

export interface INotification {
    userId: Types.ObjectId;
    title: string;
    case: string;
    type: 'order' | 'payment' | 'promotion' | 'system' | 'chat' | 'offer' | 'bid';
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