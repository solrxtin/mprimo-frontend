import mongoose from "mongoose";
import {Analytics} from "../types/analytics.type"


const analyticsSchema = new mongoose.Schema<Analytics>({
    entityId: mongoose.Schema.Types.ObjectId,
    entityType: { type: String, enum: ['product', 'vendor', 'category'] },
    metrics: {
      views: Number,
      clicks: Number,
      addToCart: Number,
      purchases: Number,
      revenue: Number
    },
    timeframe: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    date: Date
}, {timestamps: true})

const Analytics = mongoose.model("Analytic", analyticsSchema);

export default Analytics;
  