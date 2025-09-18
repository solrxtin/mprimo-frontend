import mongoose from "mongoose";
import { IVendor } from "../types/vendor.type";

const vendorSchema = new mongoose.Schema<IVendor>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
    },
    accountType: {
      type: String,
      enum: ["personal", "business"],
      required: true,
    },
    kycStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    stripeAccountId: {
      type: String,
      sparse: true,
    },
    stripeVerificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verificationDocuments: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ["ID", "Proof of Address", "Business Registration", "Tax Document"],
          required: true,
        },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        verifiedAt: Date,
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        remarks: String,
      },
    ],
    businessInfo: {
      name: {
        type: String,
        required: [true, "Business name is required."],
        trim: true,
      },
      registrationNumber: {
        type: String,
        // required: [
        //   function (this: any) {
        //     return this.accountType === "business";
        //   },
        //   "Registration number is required for business accounts.",
        // ],
        unique: true,
        sparse: true,
      },
      taxId: {
        type: String,
        // required: [
        //   function (this: any) {
        //     return this.accountType === "business";
        //   },
        //   "Tax ID is required for business accounts.",
        // ],
        unique: true,
        sparse: true, //Allows null/undefined values for persoanl accounts
      },
      address: {
        street: {
          type: String,
          required: [true, "Street address is required."],
        },
        city: { type: String, required: [true, "City is required."] },
        state: { type: String, required: [true, "State is required."] },
        country: { type: String, required: [true, "Country is required."] },
        postalCode: {
          type: String,
          required: [true, "Postal code is required."],
          match: [/^[A-Za-z0-9 -]{2,10}$/, "Invalid postal code format."],
        },
      },
    },
    bankDetails: {
      accountHolder: {
        type: String,
        required: false,
      },
      accountNumber: {
        type: String,
        required: false,
        match: [
          /^\d{10,20}$/,
          "Account number must be between 10 and 20 digits.",
        ],
      },
      bankName: { type: String, required: false },
      swiftCode: {
        type: String,
        match: [/^[A-Z0-9]{8,11}$/, "Invalid SWIFT code format."],
      },
    },
    sellingLimits: {
      maxProducts: {
        type: Number,
        default: function (this: any) {
          return this.accountType === "personal" ? 10 : null; // null means unlimited for business
        },
      },
    },
    ratings: {
      average: {
        type: Number,
        min: [0, "Average rating cannot be negative."],
        max: [5, "Average rating cannot exceed 5."],
      },
      count: { type: Number, min: [0, "Rating count cannot be negative."] },
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "active", "suspended"],
        message: "Invalid status value.",
      },
      default: "pending",
    },
    analytics: {
      totalSales: { type: Number, min: [0, "Total sales cannot be negative."] },
      totalRevenue: {
        type: Number,
        min: [0, "Total revenue cannot be negative."],
      },
      averageRating: {
        type: Number,
        min: [0, "Average rating cannot be negative."],
        max: [5, "Average rating cannot exceed 5."],
      },
      productCount: {
        type: Number,
        min: [0, "Product count cannot be negative."],
      },
    },
    settings: {
      autoAcceptOrders: { type: Boolean, default: false },
      minOrderAmount: {
        type: Number,
        min: [0, "Minimum order amount cannot be negative."],
      },
      shippingMethods: [
        {
          name: {
            type: String,
            required: [true, "Shipping method name is required."],
          },
          price: {
            type: Number,
            min: [0, "Shipping price cannot be negative."],
          },
          estimatedDays: {
            type: Number,
            min: [1, "Estimated delivery days must be at least 1."],
          },
        },
      ],
    },
    subscription: {
      currentPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionPlan",
      },
      isTrial: { type: Boolean, default: true },
      startDate: { type: Date, default: Date.now },
      endDate: Date,
      autoDowngradeAt: Date,
      status: {
        type: String,
        enum: ["active", "expired", "cancelled"],
        default: "active",
      },
    },
    wallet: {
      balance: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      transactions: [
        {
          type: {
            type: String,
            enum: ["credit", "debit"],
          },
          isTopUp: {
            type: Boolean,
            default: false,
          },
          amount: Number,
          description: String,
          date: { type: Date, default: Date.now },
          relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        },
      ],
    },
    warnings: [
      {
        type: {
          type: String,
          enum: [
            "Product Quality Issues",
            "Late Shipping",
            "Policy Violation",
            "Customer Complaint",
            "Others",
          ],
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    suspension: {
      type: {
        reason: { type: String, required: true },
        explanation: { type: String, required: true },
        suspendedAt: { type: Date, default: Date.now },
        resumesAt: { type: Date },
        enforcedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
      required: false,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);
vendorSchema.methods.canAddMoreProducts = async function () {
  if (this.accountType === "business") return true;

  const currentProductCount = this.analytics.productCount || 0;
  return currentProductCount < this.sellingLimits.maxProducts;
};

// Add a method to upgrade from personal to business
vendorSchema.methods.upgradeToBusinessAccount = async function (
  businessData: any
) {
  this.accountType = "business";
  this.businessInfo = businessData.businessInfo;
  this.kycStatus = "pending"; // Reset KYC status for new verification
  this.sellingLimits.maxProducts = null; // Remove product limit

  return this.save();
};

vendorSchema.methods.updateKYCStatus = async function (newStatus: string) {
  this.kycStatus = newStatus;
  return this.save();
};
const Vendor = mongoose.model<IVendor>("Vendor", vendorSchema);

export default Vendor;
