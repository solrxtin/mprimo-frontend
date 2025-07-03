import mongoose, { CallbackError } from "mongoose";
import { IOrder, IRefund } from "../types/order.type";
import Product from "./product.model";
import Vendor from "./vendor.model";

const orderSchema = new mongoose.Schema<IOrder>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
          max: [100, "Quantity cannot exceed 100"],
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0.01, "Price must be at least 0.01"],
        },
      },
    ],
    payment: {
      method: {
        type: String,
        required: [true, "Payment method is required"],
        enum: {
          values: ["credit_card", "paypal", "bank_transfer", "crypto"],
          message: "Invalid payment method",
        },
      },
      status: {
        type: String,
        enum: {
          values: ["pending", "completed", "failed", "refunded"],
          message: "Invalid payment status",
        },
        default: "pending",
      },
      transactionId: {
        type: String,
        required: [
          function (this: IOrder) {
            return this.payment?.status === "completed";
          },
          "Transaction ID is required for completed payments",
        ],
      },
      amount: {
        type: Number,
        required: [true, "Payment amount is required"],
        min: [0.01, "Amount must be at least 0.01"],
        validate: {
          validator: function (this: IOrder, value: number) {
            if (this.items) {
              const calculatedTotal = this.items.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
              );
              return Math.abs(value - calculatedTotal) < 0.01;
            }
            return true;
          },
          message: "Payment amount must match order total",
        },
      },
      currency: {
        type: String,
        required: [true, "Currency is required"],
        uppercase: true,
        default: "USD",
      },
    },
    shipping: {
      address: {
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
          maxlength: [50, "City cannot exceed 50 characters"],
        },
        state: {
          type: String,
          trim: true,
          maxlength: [50, "State cannot exceed 50 characters"],
        },
        country: {
          type: String,
          required: [true, "Country is required"],
          trim: true,
          maxlength: [50, "Country cannot exceed 50 characters"],
        },
        postalCode: {
          type: String,
          required: [true, "Postal code is required"],
          validate: {
            validator: function (v: string) {
              return /^[a-zA-Z0-9\- ]{3,10}$/.test(v);
            },
            message: "Invalid postal code format",
          },
        },
      },
      carrier: {
        type: String,
        required: [
          function (this: IOrder) {
            return ["shipped", "delivered", "returned"].includes(
              this.shipping?.status || ""
            );
          },
          "Carrier is required when order is shipped",
        ],
        enum: ["fedex", "ups", "usps", "dhl", "other"],
      },
      trackingNumber: {
        type: String,
        required: [
          function (this: IOrder) {
            return ["shipped", "delivered", "returned"].includes(
              this.shipping?.status || ""
            );
          },
          "Tracking number is required when order is shipped",
        ],
        validate: {
          validator: function (v: string) {
            return /^[A-Z0-9]{8,20}$/.test(v);
          },
          message: "Invalid tracking number format",
        },
      },
      status: {
        type: String,
        enum: {
          values: ["pending", "processing", "shipped", "delivered", "returned"],
          message: "Invalid shipping status",
        },
        default: "pending",
      },
      estimatedDelivery: {
        type: Date,
        validate: {
          validator: function (this: IOrder, v: Date) {
            if (this.shipping?.status === "shipped") {
              return v > new Date();
            }
            return true;
          },
          message: "Estimated delivery must be in the future",
        },
      },
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "processing", "delivered", "cancelled"],
        message: "Invalid order status",
      },
      default: "pending",
    },   
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [200, "Cancellation reason cannot exceed 200 characters"],
    },
    
    cancelledAt: {
      type: Date,
      validate: {
        validator: function (this: IOrder, value: Date) {
          return this.status === "cancelled" ? value instanceof Date : true;
        },
        message: "cancelledAt must be set when status is cancelled",
      },
    },
    
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Validate at least one order item exists
orderSchema.pre("validate", function (next) {
  if (this.items && this.items.length < 1) {
    this.invalidate("items", "At least one order item is required");
  }
  next();
});

// Validate order status transitions
orderSchema.pre("save", function (next) {
  const statusOrder = ["pending", "confirmed", "shipped", "delivered"];
  const currentStatusIndex = statusOrder.indexOf(this.status);
  const previousStatus = this.isModified("status")
    ? this.get("status")
    : this.status;

  if (previousStatus === "cancelled" && this.status !== "cancelled") {
    this.invalidate("status", "Cannot change status from cancelled");
  }

  if (
    currentStatusIndex > -1 &&
    statusOrder.indexOf(previousStatus) > currentStatusIndex
  ) {
    this.invalidate(
      "status",
      `Cannot change status from ${previousStatus} to ${this.status}`
    );
  }

  next();
});

orderSchema.post("save", async function (doc, next) {
  try {
    // Ensure it's a new order (not an update)
    if (!doc.isNew) return next();

    const order = doc;
    const vendorSalesMap = new Map();

    // Group items by vendor and sum their totals
    for (const item of order.items) {
      const product = await Product.findById(item.productId).select("vendorId");
      if (!product) continue;

      const vendorId = product.vendorId.toString();
      const salesCount = item.quantity;
      const revenue = item.quantity * item.price;

      const current = vendorSalesMap.get(vendorId) || { totalSales: 0, totalRevenue: 0 };
      vendorSalesMap.set(vendorId, {
        totalSales: current.totalSales + salesCount,
        totalRevenue: current.totalRevenue + revenue,
      });
    }

    // Update each vendor's analytics
    await Promise.all(
      Array.from(vendorSalesMap.entries()).map(async ([vendorId, { totalSales, totalRevenue }]) => {
        await Vendor.findByIdAndUpdate(vendorId, {
          $inc: {
            "analytics.totalSales": totalSales,
            "analytics.totalRevenue": totalRevenue,
          },
        });
      })
    );

    next();
  } catch (error) {
    console.error("Error updating vendor analytics:", error);
    next(error as CallbackError);
  }
});


const refundSchema = new mongoose.Schema<IRefund>(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Refund amount must be positive"],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [300, "Reason can't exceed 300 characters"],
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // or "Admin" if your platform distinguishes
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const Refund = mongoose.model<IRefund>("Refund", refundSchema);


const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
