import { Types, Document } from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId;
  variantId: string; // SKU of selected variant
  quantity: number;
  price: number;
  addedAt?: Date;
}

export interface ICart {
  userId: Types.ObjectId;
  items: ICartItem[];
  lastUpdated: Date;
}


export interface IUser extends Document {
  _id: Types.ObjectId;
  _doc: Document;
  email: string;
  password?: string;
  businessName?: string;
  profile: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatar?: string;
    sex?: string;
  };
  addresses?: Array<{
    _id?: Types.ObjectId;
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
  role: "personal" | "business" | "admin";
  status: "active" | "inactive" | "suspended";
  canMakeSales: boolean;
  saleLimit: number;
  salesCount: number;
  preferences: {
    language?: string;
    currency?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    marketing?: boolean;
  };
  activity: {
    lastLogin?: Date;
    lastPurchase?: Date;
    totalOrders?: number;
    totalSpent?: number;
  };
  // Removed cart and wishlist - using separate models
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
    backupCodes?: [
      {
        code: string;
        used: boolean;
      }
    ];
  };
}
