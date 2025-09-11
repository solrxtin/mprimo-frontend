import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import SubscriptionPlan from '../models/subscription-plan.model';
import Vendor from '../models/vendor.model';
import PayoutRequest from '../models/payout-request.model';

export class SubscriptionController {
  // Get all subscription plans
  static async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await SubscriptionPlan.find().sort({ price: 1 });
      
      res.json({
        success: true,
        plans
      });
    } catch (error) {
      next(error);
    }
  }

  // Get vendor's current subscription
  static async getVendorSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const { vendorId } = req.params;
      
      const vendor = await Vendor.findById(vendorId)
        .populate('subscription.currentPlan')
        .select('subscription');

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      res.json({
        success: true,
        subscription: vendor.subscription
      });
    } catch (error) {
      next(error);
    }
  }

  // Upgrade subscription
  static async upgradeSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const { vendorId } = req.params;
      const { planName } = req.body;

      await SubscriptionService.upgradeSubscription(vendorId, planName);

      res.json({
        success: true,
        message: `Successfully upgraded to ${planName} plan`
      });
    } catch (error) {
      next(error);
    }
  }

  // Check plan limits
  static async checkLimits(req: Request, res: Response, next: NextFunction) {
    try {
      const { vendorId } = req.params;
      const { action, currentUsage } = req.query;

      const canPerform = await SubscriptionService.checkPlanLimits(
        vendorId,
        action as string,
        currentUsage ? Number(currentUsage) : undefined
      );

      res.json({
        success: true,
        canPerform,
        action
      });
    } catch (error) {
      next(error);
    }
  }

  // Get vendor wallet
  static async getWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const { vendorId } = req.params;
      
      const vendor = await Vendor.findById(vendorId).select('wallet');
      
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      res.json({
        success: true,
        wallet: vendor.wallet
      });
    } catch (error) {
      next(error);
    }
  }

  // Request payout
  static async requestPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const { vendorId } = req.params;
      const { amount, type } = req.body;

      const vendor = await Vendor.findById(vendorId).populate('subscription.currentPlan');
      
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      // Check if vendor has sufficient balance
      if (vendor.wallet.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      // Check if payout type is allowed in plan
      const plan = vendor.subscription.currentPlan as any;
      if (!plan.payoutOptions.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `${type} payout not available in your plan`
        });
      }

      // Calculate processing fee for instant payouts
      let processingFee = 0;
      if (type === 'instant') {
        processingFee = Math.round(amount * 0.01); // 1% fee for instant payouts
      }

      const payoutRequest = await PayoutRequest.create({
        vendor: vendorId,
        amount,
        type,
        processingFee
      });

      // Move amount from balance to pending
      await Vendor.findByIdAndUpdate(vendorId, {
        $inc: {
          'wallet.balance': -amount,
          'wallet.pending': amount
        },
        $push: {
          'wallet.transactions': {
            type: 'debit',
            amount,
            description: `Payout request - ${type}`,
            date: new Date()
          }
        }
      });

      res.json({
        success: true,
        payoutRequest,
        message: 'Payout request submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get payout requests
  static async getPayoutRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { vendorId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const payouts = await PayoutRequest.find({ vendor: vendorId })
        .sort({ requestedAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await PayoutRequest.countDocuments({ vendor: vendorId });

      res.json({
        success: true,
        payouts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }
}