import mongoose from "mongoose";
import { Product } from "../types/product.type";

const productSchema = new mongoose.Schema<Product>({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  name: String,
  description: String,
  category: {
    main: String,
    sub: String,
  },
  price: {
    amount: Number,
    currency: String,
  },
  inventory: {
    quantity: Number,
    sku: String,
    lowStockAlert: Number,
  },
  images: [String],
  specifications: [
    {
      key: String,
      value: String,
    },
  ],
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    restrictions: [String],
  },
  status: { type: String, enum: ["active", "inactive", "outOfStock"] },
  ratings: {
    average: Number,
    count: Number,
  },
  variants:  [{
    name: String,
    options: [{
      value: String,
      price: Number,
      inventory: Number
    }]
  }],
    analytics: {
        views: Number,
        purchases: Number,
        conversionRate: Number,
    },
  createdAt: Date,
  updatedAt: Date,
});


const Product = mongoose.model<Product>("Product", productSchema);

export default Product;
