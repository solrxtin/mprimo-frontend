import mongoose from 'mongoose';

export interface Product {
    vendorId: mongoose.Schema.Types.ObjectId;
    name: string;
    description: string;
    category: {
        main: string;
        sub: string;
    };
    price: {
        amount: number;
        currency: string;
    };
    inventory: {
        quantity: number;
        sku: string;
        lowStockAlert: number;
    };
    images: string[];
    specifications: [{
        key: String,
      value: String
    }];
    shipping: {
        weight: number;
        dimensions: {
            length: number;
            width: number;
            height: number;
        };
        restrictions: string[];
    };
    status: 'active' | 'inactive' | 'outOfStock';
    ratings: {
        average: number;
        count: number;
    };
    variants: [
        {
            name: string;
            options: [
                {
                    value: string;
                    price: number;
                    inventory: number;
                }
            ]
        }
    ];
    analytics: {
        views: number;
        purchases: number;
        conversionRate: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
}