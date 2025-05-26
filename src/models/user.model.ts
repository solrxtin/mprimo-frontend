import mongoose from "mongoose";
import { User } from "../types/user.type";

const userSchema = new mongoose.Schema<User>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: {
        validator: (value: string) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Invalid email format",
      },
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        // Only require password if no social logins exist
        return this.socialLogins?.length === 0;
      },
    },
    profile: {
      firstName: {
        type: String,
        trim: true,
        maxlength: [50, "First name cannot exceed 50 characters"],
      },
      lastName: {
        type: String,
        trim: true,
        maxlength: [50, "Last name cannot exceed 50 characters"],
      },
      phoneNumber: {
        type: String,
        validate: {
          validator: (value: string) => {
            // Supports international phone numbers
            return /^\+?[1-9]\d{1,14}$/.test(value);
          },
          message:
            "Invalid phone number format. Please use international format (+1234567890)",
        },
      },
      avatar: {
        type: String,
        required: false,
      },
      sex: {
        type: String,
        enum: {
          values: ["Male", "Female"],
          message: "sex must be either Male or Female",
        },
      },
    },
    isEmailVerified: { type: Boolean, default: false },
    addresses: [
      {
        type: {
          type: String,
          enum: {
            values: ["billing", "shipping"],
            message: "Address type must be either billing or shipping",
          },
          required: [true, "Address type is required"],
        },
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
        street: {
          type: String,
          required: [true, "Street address is required"],
          trim: true,
          maxlength: [100, "Street address cannot exceed 100 characters"],
        },
        city: {
          type: String,
          required: [true, "City is required"],
          trim: true,
          maxlength: [50, "City name cannot exceed 50 characters"],
        },
        state: {
          type: String,
          trim: true,
          maxlength: [50, "State name cannot exceed 50 characters"],
        },
        country: {
          type: String,
          required: [true, "Country is required"],
          trim: true,
          maxlength: [50, "Country name cannot exceed 50 characters"],
        },
        postalCode: {
          type: String,
          required: [true, "Postal code is required"],
          validate: {
            validator: (value: string) => {
              // Basic international postal code validation
              return /^[a-zA-Z0-9\- ]{3,10}$/.test(value);
            },
            message: "Invalid postal code format",
          },
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    socialLogins: [
      {
        provider: {
          type: String,
          required: [true, "Social login provider is required"],
          enum: {
            values: ["google", "facebook", "apple"],
            message: "Unsupported social login provider",
          },
        },
        providerId: {
          type: String,
          required: [true, "Social login provider ID is required"],
        },
      },
    ],
    role: {
      type: String,
      enum: {
        values: ["personal", "business", "admin"],
        message: "Invalid user role",
      },
      default: "personal",
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "suspended"],
        message: "Invalid user status",
      },
      default: "active",
    },
    canMakeSales: {
      type: Boolean,
      default: false,
    },
    saleLimit: {
      type: Number,
      default: 0
    },
    salesCount: {
      type: Number,
      default: 0
    },
    preferences: {
      language: {
        type: String,
        enum: ["en", "es", "fr", "de", "it"],
        default: "en",
      },
      currency: {
        type: String,
        enum: ["USD", "EUR", "GBP", "JPY", "CAD", "NGN"],
        default: "USD",
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      marketing: { type: Boolean, default: false },
    },
    activity: {
      lastLogin: Date,
      lastPurchase: Date,
      totalOrders: { type: Number, default: 0, min: 0 },
      totalSpent: { type: Number, default: 0, min: 0 },
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    twoFactorAuth: {
      enabled: { type: Boolean, default: false },
      secret: { type: String },
      tempSecret: { type: String },
      backupCodes: [{ type: String }],
    },
  },
  {
    timestamps: true,
    // Enable virtuals when converting to JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const User = mongoose.model<User>("User", userSchema);

export default User;
