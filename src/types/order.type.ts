import mongoose, { Types, Document} from "mongoose"

export interface ItemType {
    productId: Types.ObjectId;
    quantity: number;
    price: number;
}

export interface IOrder extends Document {
    userId: Types.ObjectId;
    items: ItemType[];
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
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    cancellationReason?: string;
    cancelledAt?: Date;
    refund: {
        amount: number;
        reason: string;
        method: 'original' | 'store_credit' | 'manual';
        status: 'pending' | 'completed' | 'failed';
        transactionId: string;
        processedAt?: Date;
    }
    createdAt? : Date;
    updatedAt? : Date;
}


export interface IRefund {
  _id?: Types.ObjectId;
  orderId: Types.ObjectId;
  amount: number;
  reason?: string;
  processedBy: Types.ObjectId;
  processedAt: Date;
  status: "pending" | "processed" | "failed";
}