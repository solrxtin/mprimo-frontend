import mongoose, {Types} from "mongoose";



export interface WishlistItem {
  productId: string;
  price: number;
  name: string;
  images: string[];
  variantId?: string;
  optionId?: string;
  vendorCurrency?: string;
}

export interface IWishlist {
    userId: Types.ObjectId;
    items: WishlistItem[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CartItem {
    productId: Types.ObjectId;
    variantId: string; // SKU of selected variant
    optionId?: string; // ID of selected option
    quantity: number;
    name: string
    images: string[]
    price: number;
    addedAt?: Date;
    vendorCurrency?: string;
}

export interface ICart {
    userId: Types.ObjectId;
    items: CartItem[];
    lastUpdated: Date;
    createdAt?: Date;
    updatedAt?: Date;
}