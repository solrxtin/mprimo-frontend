import mongoose from "mongoose";
import { User } from "../types/user.type";

const userSchema = new mongoose.Schema<User>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      validate: {
        validator: (value: string) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Invalid email format'
      },
      lowercase: true
    },
    password: {
      type: String,
      required: function() {
        // Only require password if no social logins exist
        return this.socialLogins?.length === 0;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      validate: {
        validator: (value: string) => {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }
    },
    profile: {
      firstName: {
        type: String,
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
      },
      lastName: {
        type: String,
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
      },
      phoneNumber: {
        type: String,
        validate: {
          validator: (value: string) => {
            // Supports international phone numbers
            return /^\+?[1-9]\d{1,14}$/.test(value);
          },
          message: 'Invalid phone number format. Please use international format (+1234567890)'
        }
      },
      avatar: {
        type: String,
        validate: {
          validator: (value: string) => {
            return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value);
          },
          message: 'Invalid avatar URL'
        }
      }
    },
    addresses: [{
      type: {
        type: String,
        enum: {
          values: ['billing', 'shipping'],
          message: 'Address type must be either billing or shipping'
        },
        required: [true, 'Address type is required']
      },
      _id: { 
        type: mongoose.Schema.Types.ObjectId, 
        auto: true 
      },
      street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
        maxlength: [100, 'Street address cannot exceed 100 characters']
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [50, 'City name cannot exceed 50 characters']
      },
      state: {
        type: String,
        trim: true,
        maxlength: [50, 'State name cannot exceed 50 characters']
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        maxlength: [50, 'Country name cannot exceed 50 characters']
      },
      postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        validate: {
          validator: (value: string) => {
            // Basic international postal code validation
            return /^[a-zA-Z0-9\- ]{3,10}$/.test(value);
          },
          message: 'Invalid postal code format'
        }
      },
      isDefault: {
        type: Boolean,
        default: false
      }
    }],
    socialLogins: [{
      provider: {
        type: String,
        required: [true, 'Social login provider is required'],
        enum: {
          values: ['google', 'facebook', 'apple'],
          message: 'Unsupported social login provider'
        }
      },
      providerId: {
        type: String,
        required: [true, 'Social login provider ID is required']
      }
    }],
    role: {
      type: String,
      enum: {
        values: ['customer', 'vendor', 'admin'],
        message: 'Invalid user role'
      },
      default: 'customer'
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'suspended'],
        message: 'Invalid user status'
      },
      default: 'active'
    },
    preferences: {
      language: {
        type: String,
        enum: ['en', 'es', 'fr', 'de', 'it'],
        default: 'en'
      },
      currency: {
        type: String,
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD'],
        default: 'USD'
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false }
      },
      marketing: { type: Boolean, default: false }
    },
    activity: {
      lastLogin: Date,
      lastPurchase: Date,
      totalOrders: { type: Number, default: 0, min: 0 },
      totalSpent: { type: Number, default: 0, min: 0 }
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date
  }, 
  {
    timestamps: true,
    // Enable virtuals when converting to JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


const User = mongoose.model<User>('User', userSchema);

export default User;
