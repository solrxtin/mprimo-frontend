import mongoose, {Types} from "mongoose";

export interface INotification {
    userId: Types.ObjectId;
    title: string;
    case: string;
    type: string;
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