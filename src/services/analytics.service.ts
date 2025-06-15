// src/services/analytics.service.ts
import mongoose, {Types} from 'mongoose';
import AnalyticsModel, { IAnalyticsMetrics } from '../models/analytics.model';
import redisService from './redis.service';

class AnalyticsService {
  /**
   * Get analytics for a specific entity
   * @param entityId ID of the entity (product, vendor, category)
   * @param entityType Type of entity
   * @param timeframe Timeframe for analytics
   * @param startDate Start date for analytics
   * @param endDate End date for analytics
   */
  async getAnalytics(
    entityId: string,
    entityType: 'product' | 'vendor' | 'category',
    timeframe: 'daily' | 'weekly' | 'monthly' = 'daily',
    startDate?: Date,
    endDate?: Date
  ) {
    // Set default date range if not provided
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    
    const query = {
      entityId: new mongoose.Types.ObjectId(entityId),
      entityType,
      timeframe,
      date: {
        $gte: start,
        $lte: end
      }
    };
    
    const analytics = await AnalyticsModel.find(query).sort({ date: 1 });
    
    return {
      entityId,
      entityType,
      timeframe,
      startDate: start,
      endDate: end,
      analytics
    };
  }
  
  /**
   * Get dashboard analytics summary
   * @param entityType Type of entity to get analytics for
   * @param limit Number of top entities to return
   */
  async getDashboardAnalytics(
    entityType: 'product' | 'vendor' | 'category' = 'product',
    limit = 5
  ) {
    // Get date range for today, this week, and this month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get top entities by views
    const topByViews = await AnalyticsModel.aggregate([
      {
        $match: {
          entityType,
          date: { $gte: startOfMonth },
          'metrics.views': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$entityId',
          totalViews: { $sum: '$metrics.views' },
          totalPurchases: { $sum: '$metrics.purchases' },
          totalRevenue: { $sum: '$metrics.revenue' }
        }
      },
      {
        $sort: { totalViews: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: entityType === 'product' ? 'products' : 
                entityType === 'vendor' ? 'vendors' : 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'entity'
        }
      },
      {
        $unwind: '$entity'
      },
      {
        $project: {
          _id: 1,
          name: '$entity.name',
          totalViews: 1,
          totalPurchases: 1,
          totalRevenue: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$totalViews', 0] },
              { $multiply: [{ $divide: ['$totalPurchases', '$totalViews'] }, 100] },
              0
            ]
          }
        }
      }
    ]);
    
    // Get top entities by revenue
    const topByRevenue = await AnalyticsModel.aggregate([
      {
        $match: {
          entityType,
          date: { $gte: startOfMonth },
          'metrics.revenue': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$entityId',
          totalRevenue: { $sum: '$metrics.revenue' },
          totalViews: { $sum: '$metrics.views' },
          totalPurchases: { $sum: '$metrics.purchases' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: entityType === 'product' ? 'products' : 
                entityType === 'vendor' ? 'vendors' : 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'entity'
        }
      },
      {
        $unwind: '$entity'
      },
      {
        $project: {
          _id: 1,
          name: '$entity.name',
          totalRevenue: 1,
          totalViews: 1,
          totalPurchases: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$totalViews', 0] },
              { $multiply: [{ $divide: ['$totalPurchases', '$totalViews'] }, 100] },
              0
            ]
          }
        }
      }
    ]);
    
    // Get summary metrics
    const todayMetrics = await this.getSummaryMetrics(entityType, today, new Date());
    const weekMetrics = await this.getSummaryMetrics(entityType, startOfWeek, new Date());
    const monthMetrics = await this.getSummaryMetrics(entityType, startOfMonth, new Date());
    
    // Get real-time metrics from Redis
    const realtimeMetrics = await this.getRealtimeMetrics(entityType);
    
    return {
      topByViews,
      topByRevenue,
      summary: {
        today: todayMetrics,
        week: weekMetrics,
        month: monthMetrics
      },
      realtime: realtimeMetrics
    };
  }
  
  /**
   * Get summary metrics for a specific time period
   */
  private async getSummaryMetrics(
    entityType: 'product' | 'vendor' | 'category',
    startDate: Date,
    endDate: Date
  ) {
    const result = await AnalyticsModel.aggregate([
      {
        $match: {
          entityType,
          date: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          views: { $sum: '$metrics.views' },
          clicks: { $sum: '$metrics.clicks' },
          addToCart: { $sum: '$metrics.addToCart' },
          purchases: { $sum: '$metrics.purchases' },
          revenue: { $sum: '$metrics.revenue' }
        }
      },
      {
        $project: {
          _id: 0,
          views: 1,
          clicks: 1,
          addToCart: 1,
          purchases: 1,
          revenue: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$views', 0] },
              { $multiply: [{ $divide: ['$purchases', '$views'] }, 100] },
              0
            ]
          }
        }
      }
    ]);
    
    return result.length > 0 ? result[0] : {
      views: 0,
      clicks: 0,
      addToCart: 0,
      purchases: 0,
      revenue: 0,
      conversionRate: 0
    };
  }
  
  /**
   * Get real-time metrics from Redis
   */
  private async getRealtimeMetrics(entityType: 'product' | 'vendor' | 'category') {
    // This would be implemented to get real-time metrics from Redis
    // For now, we'll return placeholder data
    return {
      activeUsers: 0,
      viewsLastHour: 0,
      purchasesLastHour: 0,
      revenueLastHour: 0
    };
  }
  
  /**
   * Track an event manually (for testing or backfilling)
   */
  async trackEvent(
    entityId: string,
    entityType: 'product' | 'vendor' | 'category',
    eventType: 'view' | 'click' | 'addToCart' | 'purchase',
    userId?: Types.ObjectId,
    amount?: number
  ) {
    // Use Redis service to track the event
    await redisService.trackEvent(entityId, eventType, userId, amount);
    
    return {
      success: true,
      message: `${eventType} event tracked for ${entityType} ${entityId}`
    };
  }
}

export default new AnalyticsService();