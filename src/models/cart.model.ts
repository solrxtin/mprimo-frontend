import mongoose from "mongoose";
import {Wishlist, Cart} from "../types/cart.type";

// Wishlist Schema
const wishlistSchema = new mongoose.Schema<Wishlist>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        addedAt: Date,
        priceWhenAdded: Number,
      },
    ],
  },
  { timestamps: true }
);

export const WishList = mongoose.model<Wishlist>("Wishlist", wishlistSchema);

// Cart Schema
const cartSchema = new mongoose.Schema<Cart>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number
    },
  ],
  lastUpdated: Date,
}, {timestamps: true});

const Cart = mongoose.model<Cart>("Cart", cartSchema);

export default Cart;
