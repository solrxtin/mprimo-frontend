import mongoose, { Schema, Document, Types } from "mongoose";
import { Product } from "../types/product.type";


// Product Schema
const ProductSchema = new Schema<Product>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    
    name: { type: String, required: true, trim: true },
    
    description: { type: String, required: true, trim: true },
    
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },

    price: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, required: true, trim: true },
    },

    inventory: {
      quantity: { type: Number, required: true, min: 0 },
      sku: { type: String, required: true, unique: true, trim: true },
      lowStockAlert: { type: Number, required: true, min: 0 },
    },

    images: {
      type: [String],
      validate: [arrayLimit, 'At least one image is required'],
    },

    specifications: [
      {
        key: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
      },
    ],

    shipping: {
      weight: { type: Number, required: true, min: 0 },
      dimensions: {
        length: { type: Number, required: true, min: 0 },
        width: { type: Number, required: true, min: 0 },
        height: { type: Number, required: true, min: 0 },
      },
      restrictions: { type: [String], default: [] },
    },

    status: {
      type: String,
      enum: ["active", "inactive", "outOfStock"],
      default: "active",
    },

    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },

    variants: [
      {
        name: { type: String, required: true, trim: true },
        options: [
          {
            value: { type: String, required: true },
            price: { type: Number, required: true, min: 0 },
            inventory: { type: Number, required: true, min: 0 },
          },
        ],
      },
    ],

    analytics: {
      views: { type: Number, default: 0 },
      purchases: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Validator function to ensure images array has at least one image
function arrayLimit(val: string[]) {
  return val.length > 0;
}

const ProductModel = mongoose.model<Product>("Product", ProductSchema);

export default ProductModel;