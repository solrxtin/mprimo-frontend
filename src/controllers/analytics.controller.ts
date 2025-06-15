// src/controllers/analytics.controller.ts
import { Request, Response, NextFunction } from 'express';
import analyticsService from '../services/analytics.service';

export class AnalyticsController {
  /**
   * Get analytics for a specific entity
   */
  static async getEntityAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityId, entityType } = req.params;
      const { timeframe = 'daily', startDate, endDate } = req.query;
      
      // Validate entity type
      if (!['product', 'vendor', 'category'].includes(entityType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid entity type. Must be product, vendor, or category.'
        });
      }
      
      // Validate timeframe
      if (!['daily', 'weekly', 'monthly'].includes(timeframe as string)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid timeframe. Must be daily, weekly, or monthly.'
        });
      }
      
      // Parse dates if provided
      const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
      const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
      
      const analytics = await analyticsService.getAnalytics(
        entityId,
        entityType as 'product' | 'vendor' | 'category',
        timeframe as 'daily' | 'weekly' | 'monthly',
        parsedStartDate,
        parsedEndDate
      );
      
      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get dashboard analytics summary
   */
  static async getDashboardAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType = 'product', limit = 5 } = req.query;
      
      // Validate entity type
      if (!['product', 'vendor', 'category'].includes(entityType as string)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid entity type. Must be product, vendor, or category.'
        });
      }
      
      const analytics = await analyticsService.getDashboardAnalytics(
        entityType as 'product' | 'vendor' | 'category',
        Number(limit)
      );
      
      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Track an event manually (for testing or backfilling)
   */
  static async trackEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityId, entityType, eventType } = req.params;
      const { userId, amount } = req.body;
      
      // Validate entity type
      if (!['product', 'vendor', 'category'].includes(entityType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid entity type. Must be product, vendor, or category.'
        });
      }
      
      // Validate event type
      if (!['view', 'click', 'addToCart', 'purchase'].includes(eventType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event type. Must be view, click, addToCart, or purchase.'
        });
      }
      
      const result = await analyticsService.trackEvent(
        entityId,
        entityType as 'product' | 'vendor' | 'category',
        eventType as 'view' | 'click' | 'addToCart' | 'purchase',
        userId,
        amount
      );
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}