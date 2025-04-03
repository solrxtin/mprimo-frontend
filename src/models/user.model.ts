import mongoose from "mongoose";
import { User } from "../types/user.type";

const userSchema = new mongoose.Schema<User>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profile: {
          firstName: String,
          lastName: String,
          phoneNumber: String,
          avatar: String
        },
        addresses: [{
          type: { type: String, enum: ['billing', 'shipping'] },
          street: String,
          city: String,
          state: String,
          country: String,
          postalCode: String,
          isDefault: Boolean
        }],
        socialLogins: [{
          provider: String,
          providerId: String
        }],
        role: { type: String, enum: ['customer', 'vendor', 'admin'] },
        status: { type: String, enum: ['active', 'inactive', 'suspended'] },
        preferences: {
            language: String,
            currency: String,
            notifications: {
                email: Boolean,
                push: Boolean,
                sms: Boolean,
            },
            marketing: Boolean,
        },
        activity: {
            lastLogin: Date,
            lastPurchase: Date,
            totalOrders: Number,
            totalSpent: Number
        },
        createdAt: Date,
        updatedAt: Date
    }
)

const User = mongoose.model<User>('User', userSchema);

export default User;