import mongoose from "mongoose";
import { IOrder } from "../types/order.type";

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
        vendorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vendor",
          required: [true, "Vendor ID is required"],
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
        enum: ["USD", "EUR", "GBP", "JPY", "CAD"],
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
          values: ["processing", "shipped", "delivered", "returned"],
          message: "Invalid shipping status",
        },
        default: "processing",
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
        values: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
        message: "Invalid order status",
      },
      default: "pending",
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

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
