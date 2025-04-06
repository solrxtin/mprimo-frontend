import mongoose from "mongoose";
import {Order} from "../types/order.type";


const orderSchema = new mongoose.Schema<Order>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number,
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }
    }],
    payment: {
      method: String,
      status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'] },
      transactionId: String,
      amount: Number,
      currency: String
    },
    shipping: {
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
      },
      carrier: String,
      trackingNumber: String,
      status: { type: String, enum: ['processing', 'shipped', 'delivered', 'returned'] },
      estimatedDelivery: Date
    },
    status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
}, {timestamps: true})

const Order = mongoose.model<Order>("Order", orderSchema);
export default Order