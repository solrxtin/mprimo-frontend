import mongoose from "mongoose";
import { User } from "../types/user.type";

const userSchema = new mongoose.Schema<User>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String },
        profile: {
          firstName: String,
          lastName: String,
          phoneNumber: String,
          avatar: String
        },
        addresses: [{
          type: { type: String, enum: ['billing', 'shipping'] },
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
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
            marketing: Boolean},
        activity: {
            lastLogin: Date,
            lastPurchase: Date,
            totalOrders: Number,
            totalSpent: Number
        },
        resetPasswordToken: String,
        resetPasswordExpiresAt: Date,
        verificationToken: String,
        verificationTokenExpiresAt: Date,
        isEmailVerified: {
          type: Boolean,
          default: false
        },
        twoFactorAuth: {
          enabled: { type: Boolean, default: false },
          secret: { type: String },
          tempSecret: { type: String },
          backupCodes: [{ type: String }]
        }
    }, {timestamps: true}
)

const User = mongoose.model<User>('User', userSchema);

export default User;