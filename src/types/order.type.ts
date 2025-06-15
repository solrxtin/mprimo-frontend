import mongoose, { Types, Document} from "mongoose"

export interface IOrder extends Document {
    userId: Types.ObjectId;
    items: [{
        productId: Types.ObjectId;
        quantity: number;
        price: number;
        vendorId: Types.ObjectId;
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