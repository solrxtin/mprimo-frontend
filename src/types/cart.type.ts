import mongoose, {Types} from "mongoose";


export interface Wishlist {
    userId: Types.ObjectId;
    items: {
        productId: Types.ObjectId;
        addedAt: Date;
        priceWhenAdded: number;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Cart {
    userId: Types.ObjectId;
    items: {
        productId: Types.ObjectId;
        quantity: number;
    }[];
    lastUpdated: Date;
    createdAt?: Date;
    updatedAt?: Date;
}