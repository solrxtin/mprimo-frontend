import mongoose from "mongoose";
import {IWishlist, ICart} from "../types/cart.type";

// Wishlist Schema
const wishlistSchema = new mongoose.Schema<IWishlist>(
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

export const WishList = mongoose.model<IWishlist>("Wishlist", wishlistSchema);

// Cart Schema
const cartSchema = new mongoose.Schema<ICart>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      variantId: { type: String, required: true }, // SKU of selected variant
      optionId: { type: String }, // ID of selected option
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
      addedAt: { type: Date, default: Date.now }
    },
  ],
  lastUpdated: { type: Date, default: Date.now },
}, {timestamps: true});

const Cart = mongoose.model<ICart>("Cart", cartSchema);

export default Cart;
