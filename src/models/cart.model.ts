import mongoose from "mongoose";
import { Cart, Wishlist } from "../types/cart.type";


// Wishlist Schema with embedded validators
const wishlistSchema = new mongoose.Schema<Wishlist>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        addedAt: { type: Date, default: Date.now },
        priceWhenAdded: { type: Number, required: true },
        currency: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const WishList = mongoose.model<Wishlist>("Wishlist", wishlistSchema);

// Cart Schema with embedded validators
const cartSchema = new mongoose.Schema<Cart>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      variantId: { type: String, required: true }, // SKU of selected variant
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
      addedAt: { type: Date, default: Date.now }
    },
  ],
  lastUpdated: { type: Date, default: Date.now },
}, {timestamps: true});

const Cart = mongoose.model<Cart>("Cart", cartSchema);

export { WishList, Cart };