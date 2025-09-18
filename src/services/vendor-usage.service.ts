import Vendor from '../models/vendor.model';
import { SubscriptionService } from './subscription.service';

export class VendorUsageService {
  
  // Get comprehensive usage statistics for a vendor
  static async getVendorUsage(vendorId: string) {
    try {
      const vendor = await Vendor.findById(vendorId).populate('subscription.currentPlan');
      if (!vendor) throw new Error('Vendor not found');

      const plan = vendor.subscription.currentPlan as any;
      const analytics = vendor.analytics || {};

      return {
        subscription: {
          planName: plan?.name || 'No Plan',
          isTrial: vendor.subscription?.isTrial || false,
          status: vendor.subscription?.status || 'inactive'
        },
        usage: {
          products: {
            current: analytics.productCount || 0,
            limit: plan?.productListingLimit || 0,
            percentage: plan?.productListingLimit ? 
              Math.round(((analytics.productCount || 0) / plan.productListingLimit) * 100) : 0
          },
          featuredProducts: {
            current: analytics.featuredProducts || 0,
            limit: plan?.featuredProductSlots || 0,
            percentage: plan?.featuredProductSlots ? 
              Math.round(((analytics.featuredProducts || 0) / plan.featuredProductSlots) * 100) : 0
          },
          payouts: {
            totalRequests: analytics.payoutRequests || 0,
            lastRequest: analytics.lastPayoutRequest || null,
            availableTypes: this.getAvailablePayoutTypes(plan)
          },
          advertising: {
            adsCreated: analytics.adsCreated || 0,
            lastAdCreated: analytics.lastAdCreated || null,
            monthlyCredits: plan?.adCreditMonthly || 0
          },
          analytics: {
            viewsCount: analytics.analyticsViews || 0,
            lastViewed: analytics.lastAnalyticsView || null,
            hasAccess: plan?.analyticsDashboard || false
          },
          bulkOperations: {
            uploadsUsed: analytics.bulkUploadsUsed || 0,
            lastUpload: analytics.lastBulkUpload || null,
            hasAccess: plan?.bulkUpload || false
          }
        },
        features: {
          customBranding: plan?.customStoreBranding || 'none',
          messagingTools: plan?.messagingTools || 'basic',
          prioritySupport: plan?.prioritySupport || 'none'
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Check if vendor can perform specific action
  static async canPerformAction(vendorId: string, action: string) {
    try {
      return await SubscriptionService.checkPlanLimits(vendorId, action);
    } catch (error) {
      return false;
    }
  }

  // Get usage warnings (approaching limits)
  static async getUsageWarnings(vendorId: string) {
    try {
      const usage = await this.getVendorUsage(vendorId);
      const warnings = [];

      // Product limit warning (80% threshold)
      if (usage.usage.products.percentage >= 80) {
        warnings.push({
          type: 'product_limit',
          message: `You've used ${usage.usage.products.current} of ${usage.usage.products.limit} products (${usage.usage.products.percentage}%). Consider upgrading soon.`,
          severity: usage.usage.products.percentage >= 95 ? 'high' : 'medium'
        });
      }

      // Featured products warning
      if (usage.usage.featuredProducts.percentage >= 80) {
        warnings.push({
          type: 'featured_limit',
          message: `You've used ${usage.usage.featuredProducts.current} of ${usage.usage.featuredProducts.limit} featured product slots.`,
          severity: usage.usage.featuredProducts.percentage >= 95 ? 'high' : 'medium'
        });
      }

      // Trial expiry warning
      if (usage.subscription.isTrial) {
        warnings.push({
          type: 'trial_expiry',
          message: 'You are on a trial plan. Upgrade to continue enjoying premium features.',
          severity: 'medium'
        });
      }

      return warnings;
    } catch (error) {
      return [];
    }
  }

  private static getAvailablePayoutTypes(plan: any) {
    if (!plan?.payoutOptions) return ['weekly'];
    return plan.payoutOptions;
  }
}