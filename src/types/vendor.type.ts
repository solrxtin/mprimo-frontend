import mongoose, { Types } from "mongoose";
import { IWallet } from "../models/wallet.model";
import { IUser } from "./user.type";

interface Subscription {
  currentPlan: Types.ObjectId;
  isTrial: boolean;
  startDate: Date;
  endDate?: Date;
  autoDowngradeAt?: Date;
  status: "active" | "expired" | "cancelled";
}

interface VerificationDocument {
  name: string;
  type: "ID" | "Proof of Address" | "Business Registration" | "Tax Document";
  url: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  status: "pending" | "verified" | "rejected";
  remarks?: string;
}

export interface IVendor {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  accountType: "personal" | "business";
  kycStatus: "pending" | "verified" | "rejected";
  verificationDocuments: VerificationDocument[];
  stripeAccountId?: string;
  stripeVerificationStatus: "pending" | "verified" | "rejected";
  businessInfo?: {
    name: string;
    registrationnumber: string;
    taxId: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  bankDetails?: {
    accountHolder: string;
    accountnumber: string;
    bankName: string;
    swiftCode: string;
  };
  sellingLimits?: {
    maxProducts: number | null;
  };
  ratings?: {
    average: number;
    count: number;
  };
  analytics: {
    totalSales: number;
    totalRevenue: number;
    averageRating: number;
    productCount: number;
    featuredProducts: number;
    payoutRequests: number;
    lastPayoutRequest?: Date;
    adsCreated: number;
    lastAdCreated?: Date;
    bulkUploadsUsed: number;
    lastBulkUpload?: Date;
    analyticsViews: number;
    lastAnalyticsView?: Date;
  };
  settings: {
    autoAcceptOrders: boolean;
    minOrderAmount: number;
    shippingMethods: [
      {
        name: string;
        price: number;
        estimatedDays: number;
      }
    ];
  };
  wallet: IWallet;
  subscription: Subscription;
  warnings?: {
    type:
      | "Product Quality Issues"
      | "Late Shipping"
      | "Policy Violation"
      | "Customer Complaints"
      | "Others";
    message: string;
    createdAt: Date;
  }[];
  suspension?: {
    reason: string;
    explanation: string;
    suspendedAt: Date;
    resumesAt: Date;
    enforcedBy: Types.ObjectId;
  };
  status: "pending" | "active" | "suspended";
  createdAt?: Date;
  updatedAt?: Date;
}
