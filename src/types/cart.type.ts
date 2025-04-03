import mongoose from "mongoose";


export interface Wishlist {
    userId: mongoose.Schema.Types.ObjectId;
    items: {
        productId: mongoose.Schema.Types.ObjectId;
        addedAt: Date;
        priceWhenAdded: number;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Cart {
    userId: mongoose.Schema.Types.ObjectId;
    items: {
        productId: mongoose.Schema.Types.ObjectId;
        quantity: number;
    }[];
    lastUpdated: Date;
    createdAt?: Date;
    updatedAt?: Date;
}