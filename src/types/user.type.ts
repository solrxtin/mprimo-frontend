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

interface Activity {
  _id?: Types.ObjectId;
  activity: string;
  createdAt: string;
}


export interface IUser extends Document {
  _id: Types.ObjectId;
  _doc: Document;
  email: string;
  password?: string;
  businessName?: string;
  profile?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatar?: string;
    sex?: string;
  };
  country?: string;
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
  role: "user" | "admin";
  status: "active" | "inactive" | "suspended";
  canMakeSales: boolean;
  saleLimit: number;
  salesCount: number;
  preferences: {
    language?: string;
    currency?: string;
    notifications: {
      email: {
        stockAlert: boolean;
        orderStatus: boolean;
        pendingReviews: boolean;
        paymentUpdates: boolean;
        newsletter: boolean;
      };
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
  adminRole?: string;
  permissions?: string[];
  paymentInformation?: {
    defaultGateway?: "stripe" | "paystack" | "flutterwave";
    cards?: Array<{
      gateway: "stripe" | "paystack" | "flutterwave";
      last4?: string;
      brand?: string;
      expMonth?: number;
      expYear?: number;
      cardHolderName?: string;
      country?: string;
      isDefault?: boolean;
      addedAt?: Date;
      metadata?: {
        stripe?: {
          customerId?: string;
          cardId?: string;
          fingerprint?: string;
        };
        paystack?: {
          authorizationCode?: string;
          bin?: string;
          bank?: string;
          cardType?: string;
          reusable?: boolean;
        };
        flutterwave?: {
          token?: string;
          cardType?: string;
          issuingBank?: string;
          bin?: string;
        };
      };
      billingAddressId?: Types.ObjectId;
    }>;
  };
  activities?: Activity[];
  vendorId?: Types.ObjectId;
}
