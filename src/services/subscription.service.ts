import SubscriptionPlan from '../models/subscription-plan.model';
import Vendor from '../models/vendor.model';
import Notification from '../models/notification.model';
import { LoggerService } from './logger.service';

const logger = LoggerService.getInstance();

export class SubscriptionService {
  // Initialize vendor with 6-month trial on Elite plan
  static async initializeVendorSubscription(vendorId: string) {
    try {
      const elitePlan = await SubscriptionPlan.findOne({ name: 'Elite' });
      if (!elitePlan) throw new Error('Elite plan not found');

      const trialEndDate = new Date();
      trialEndDate.setMonth(trialEndDate.getMonth() + 6);

      const autoDowngradeDate = new Date(trialEndDate);
      autoDowngradeDate.setDate(autoDowngradeDate.getDate() + 1);

      await Vendor.findByIdAndUpdate(vendorId, {
        'subscription.currentPlan': elitePlan._id,
        'subscription.isTrial': true,
        'subscription.startDate': new Date(),
        'subscription.endDate': trialEndDate,
        'subscription.autoDowngradeAt': autoDowngradeDate,
        'subscription.status': 'active'
      });

      logger.info(`Vendor ${vendorId} initialized with 6-month Elite trial`);
      return true;
    } catch (error) {
      logger.error('Failed to initialize vendor subscription:', error);
      throw error;
    }
  }

  // Check if vendor can perform action based on plan limits
  static async checkPlanLimits(vendorId: string, action: string, currentUsage?: number) {
    try {
      const vendor = await Vendor.findById(vendorId).populate('subscription.currentPlan');
      if (!vendor?.subscription?.currentPlan) return false;

      const plan = vendor.subscription.currentPlan as any;
      
      // Use actual vendor analytics if currentUsage not provided
      const actualProductCount = vendor.analytics?.productCount || 0;
      const actualFeaturedCount = vendor.analytics?.featuredProducts || 0;

      switch (action) {
        case 'add_product':
          const productUsage = currentUsage !== undefined ? currentUsage : actualProductCount;
          return plan.productListingLimit === -1 || productUsage < plan.productListingLimit;
        
        case 'feature_product':
          const featuredUsage = currentUsage !== undefined ? currentUsage : actualFeaturedCount;
          return featuredUsage < plan.featuredProductSlots;
        
        case 'bulk_upload':
          return plan.bulkUpload;
        
        case 'analytics_dashboard':
          return plan.analyticsDashboard;
        
        case 'custom_store_branding':
          return plan.customStoreBranding !== 'none';
        
        case 'premium_branding':
          return plan.customStoreBranding === 'premium';
        
        case 'full_messaging':
          return plan.messagingTools === 'full' || plan.messagingTools === 'full_priority';
        
        case 'priority_messaging':
          return plan.messagingTools === 'full_priority';
        
        case 'instant_payout':
          return plan.payoutOptions.includes('instant');
        
        case 'bi_weekly_payout':
          return plan.payoutOptions.includes('bi-weekly');
        
        case 'ad_credits':
          return plan.adCreditMonthly > 0;
        
        case 'priority_support':
          return plan.prioritySupport !== 'none';
        
        case 'premium_support':
          return plan.prioritySupport === 'premium';
        
        default:
          return true;
      }
    } catch (error) {
      logger.error('Failed to check plan limits:', error);
      return false;
    }
  }

  // Downgrade expired trials to Starter plan
  static async processExpiredTrials() {
    try {
      const starterPlan = await SubscriptionPlan.findOne({ name: 'Starter' });
      if (!starterPlan) throw new Error('Starter plan not found');

      const expiredVendors = await Vendor.find({
        'subscription.isTrial': true,
        'subscription.autoDowngradeAt': { $lte: new Date() },
        'subscription.status': 'active'
      });

      for (const vendor of expiredVendors) {
        await Vendor.findByIdAndUpdate(vendor._id, {
          'subscription.currentPlan': starterPlan._id,
          'subscription.isTrial': false,
          'subscription.status': 'active'
        });

        // Send notification
        await Notification.create({
          userId: vendor.userId,
          type: 'subscription_reminder',
          title: 'Trial Period Ended',
          message: 'Your 6-month trial has ended. You\'ve been moved to the Starter plan. Upgrade to unlock more features!',
          data: {
            redirectUrl: '/vendor/subscription',
            entityType: 'subscription'
          },
          isRead: false
        });

        logger.info(`Vendor ${vendor._id} downgraded from trial to Starter plan`);
      }

      return expiredVendors.length;
    } catch (error) {
      logger.error('Failed to process expired trials:', error);
      throw error;
    }
  }

  // Send trial expiry reminders
  static async sendTrialReminders() {
    try {
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 7); // 7 days before expiry

      const vendorsToRemind = await Vendor.find({
        'subscription.isTrial': true,
        'subscription.endDate': {
          $gte: new Date(),
          $lte: reminderDate
        },
        'subscription.status': 'active'
      });

      for (const vendor of vendorsToRemind) {
        await Notification.create({
          userId: vendor.userId,
          type: 'subscription_reminder',
          title: 'Trial Ending Soon',
          message: 'Your 6-month trial ends in 7 days. Upgrade now to continue enjoying premium features!',
          data: {
            redirectUrl: '/vendor/subscription',
            entityType: 'subscription'
          },
          isRead: false
        });
      }

      logger.info(`Sent trial reminders to ${vendorsToRemind.length} vendors`);
      return vendorsToRemind.length;
    } catch (error) {
      logger.error('Failed to send trial reminders:', error);
      throw error;
    }
  }

  // Upgrade vendor subscription
  static async upgradeSubscription(vendorId: string, planName: string) {
    try {
      const plan = await SubscriptionPlan.findOne({ name: planName });
      if (!plan) throw new Error('Plan not found');

      await Vendor.findByIdAndUpdate(vendorId, {
        'subscription.currentPlan': plan._id,
        'subscription.isTrial': false,
        'subscription.startDate': new Date(),
        'subscription.endDate': null,
        'subscription.autoDowngradeAt': null,
        'subscription.status': 'active'
      });

      logger.info(`Vendor ${vendorId} upgraded to ${planName} plan`);
      return true;
    } catch (error) {
      logger.error('Failed to upgrade subscription:', error);
      throw error;
    }
  }
}