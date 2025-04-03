import mongoose from "mongoose"

export interface Order {
    userId: mongoose.Schema.Types.ObjectId;
    items: [{
        productId: mongoose.Schema.Types.ObjectId;
        quantity: number;
        price: number;
        vendorId: mongoose.Schema.Types.ObjectId;
    }];
    payment: {
        method: string;
        status: 'pending' | 'completed' | 'failed' | 'refunded';
        transactionId: string;
        amount: number;
        currency: string;
    };
    shipping: {
        address: {
            street: string;
            city: string;
            state: string;
            country: string;
            postalCode: string;
        };
        carrier: string;
        trackingNumber: string;
        status: 'processing' | 'shipped' | 'delivered' | 'returned';
        estimatedDelivery: Date;
    };
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    createdAt? : Date;
    updatedAt? : Date;
}