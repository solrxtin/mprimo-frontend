import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import Vendor from '../models/vendor.model';

export const checkSubscriptionLimit = (action: string, errorMessage?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const vendor = await Vendor.findOne({ userId });
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }

      let currentUsage = 0;
      
      // Get current usage based on action type
      switch (action) {
        case 'add_product':
          currentUsage = vendor.analytics?.productCount || 0;
          break;
        case 'feature_product':
          currentUsage = vendor.analytics?.featuredProducts || 0;
          break;
      }

      const hasPermission = await SubscriptionService.checkPlanLimits(
        vendor._id.toString(),
        action,
        currentUsage
      );

      if (!hasPermission) {
        const defaultMessages: Record<string, string> = {
          'add_product': 'Product limit reached. Upgrade your plan to add more products.',
          'feature_product': 'Featured product limit reached. Upgrade to feature more products.',
          'bulk_upload': 'Bulk upload requires Pro or Elite plan.',
          'analytics_dashboard': 'Analytics dashboard requires Pro or Elite plan.',
          'instant_payout': 'Instant payouts require Elite plan.',
          'bi_weekly_payout': 'Bi-weekly payouts require Pro or Elite plan.',
          'premium_branding': 'Premium branding requires Elite plan.',
          'priority_support': 'Priority support requires Pro or Elite plan.'
        };

        return res.status(403).json({
          success: false,
          message: errorMessage || defaultMessages[action] || 'Feature not available in your current plan.'
        });
      }

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
};

export const requireFeature = (feature: string) => {
  return checkSubscriptionLimit(feature);
};