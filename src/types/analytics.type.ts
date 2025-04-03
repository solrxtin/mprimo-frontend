import mongoose from "mongoose"

export interface Analytics {
    entityId: mongoose.Schema.Types.ObjectId;
    entityType: string;
    metrics: {
        views: number;
        clicks: number;
        addToCart: number;
        purchases: number;
        revenue: number;
    };
    timeframe: 'daily' | 'weekly' | 'monthly';
    date: Date;
    createdAt?: Date;
    updatedAt?: Date;
}