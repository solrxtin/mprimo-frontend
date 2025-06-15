// src/models/analytics.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsMetrics {
  views: number;
  clicks: number;
  addToCart: number;
  purchases: number;
  revenue: number;
  conversionRate?: number;
}

export interface IAnalytics extends Document {
  entityId: mongoose.Types.ObjectId;
  entityType: 'product' | 'vendor' | 'category';
  timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly';
  date: Date;
  metrics: IAnalyticsMetrics;
  metadata?: Record<string, any>;
}

const analyticsSchema = new Schema<IAnalytics>({
  entityId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType'
  },
  entityType: {
    type: String,
    required: true,
    enum: ['product', 'vendor', 'category']
  },
  timeframe: {
    type: String,
    required: true,
    enum: ['hourly', 'daily', 'weekly', 'monthly']
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    addToCart: {
      type: Number,
      default: 0
    },
    purchases: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Calculate conversion rate before saving
analyticsSchema.pre('save', function(next) {
  if (this.metrics.views > 0) {
    this.metrics.conversionRate = (this.metrics.purchases / this.metrics.views) * 100;
  }
  next();
});

// Create compound indexes for efficient querying
analyticsSchema.index({ entityId: 1, entityType: 1, timeframe: 1, date: 1 }, { unique: true });
analyticsSchema.index({ entityType: 1, date: 1 });
analyticsSchema.index({ date: 1 });

const AnalyticsModel = mongoose.model<IAnalytics>('Analytics', analyticsSchema);

export default AnalyticsModel;