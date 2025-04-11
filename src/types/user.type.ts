import { ObjectId, Document } from "mongoose";


export interface User extends Document {
    _id: ObjectId;
    _doc: Document
    email: string;
    password?: string;
    profile: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        avatar: string;
    };
    addresses?: Array<{
        _id?: ObjectId;
        type: string;
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        isDefault: boolean;
    }>;
    socialLogins?: Array<{
        provider: string;
        providerId: string;
    }>;
    role: 'customer' | 'vendor' | 'admin';
    status: 'active' | 'inactive' | 'suspended';
    preferences: {
        language?: string;
        currency?: string;
        notifications: {
            email?: boolean;
            push?: boolean;
            sms?: boolean;
        },
        marketing?: boolean;
    },
    activity: {
        lastLogin?: Date;
        lastPurchase?: Date;
        totalOrders?: number;
        totalSpent?: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
    resetPasswordToken?: string;
    resetPasswordExpiresAt?: Date;
    verificationToken: string;
    verificationTokenExpiresAt: Date;
    isEmailVerified: boolean;
    twoFactorAuth: {
        enabled: boolean;
        secret?: string;
        tempSecret?: string;
        backupCodes?: string[];
    };
}