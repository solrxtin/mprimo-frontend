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
        variantId: {
          type: String,
          required: [true, "Variant ID (SKU) is required"],
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
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: [true, "Payment ID is required"],
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
          values: [
            "pending",
            "paid",
            "shippedToWarehouse",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled",
            "refunded",
          ],
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
      type: {
        type: String,
        enum: {
          values: ["normal", "go-fast", "go-faster"],
          message: "Invalid shipping type",
        },
        default: "normal",
        }
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
    confirmations: [
      {
        role: { type: String, enum: ["buyer", "courier"], required: true },
        confirmedAt: { type: Date, default: Date.now },
      },
    ],
    receivedItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        vendorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vendor",
          required: [true, "Vendor ID is required"],
        },
        receivedAt: {
          type: Date,
          default: Date.now
        },
        receivedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        }
      }
    ],
    rejectedItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"]
        },
        vendorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vendor",
          required: [true, "Vendor ID is required"]
        },
        reason: {
          type: String,
          required: [true, "Rejection reason is required"],
          maxlength: [200, "Reason cannot exceed 200 characters"]
        },
        explanation: {
          type: String,
          maxlength: [500, "Explanation cannot exceed 500 characters"]
        },
        rejectedAt: {
          type: Date,
          default: Date.now
        },
        rejectedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      }
    ],
    deliveryMethod: {
      type: String
    }
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
orderSchema.pre("validate", function (this: IOrder, next) {
  if (this.items && this.items.length < 1) {
    this.invalidate("items", "At least one order item is required");
  }
  next();
});

// Validate order status transitions
orderSchema.pre("save", function (this: IOrder, next) {
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

orderSchema.post(
  "save",
  async function (doc: mongoose.Document & IOrder, next) {
    try {
      // Ensure it's a new order (not an update)
      if (!doc.isNew) return next();

      const vendorSalesMap = new Map();

      // Group items by vendor and sum their totals
      for (const item of doc.items) {
        const product = await Product.findById(item.productId).select(
          "vendorId"
        );
        if (!product) continue;

        const vendorId = product.vendorId.toString();
        const salesCount = item.quantity;
        const revenue = item.quantity * item.price;

        const current = vendorSalesMap.get(vendorId) || {
          totalSales: 0,
          totalRevenue: 0,
        };
        vendorSalesMap.set(vendorId, {
          totalSales: current.totalSales + salesCount,
          totalRevenue: current.totalRevenue + revenue,
        });
      }

      // Update each vendor's analytics
      await Promise.all(
        Array.from(vendorSalesMap.entries()).map(
          async ([vendorId, { totalSales, totalRevenue }]) => {
            await Vendor.findByIdAndUpdate(vendorId, {
              $inc: {
                "analytics.totalSales": totalSales,
                "analytics.totalRevenue": totalRevenue,
              },
            });
          }
        )
      );

      next();
    } catch (error) {
      console.error("Error updating vendor analytics:", error);
      next(error as CallbackError);
    }
  }
);

const refundSchema = new mongoose.Schema<IRefund>(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
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
