import { Request, Response } from 'express';
import { StripeVerificationService } from '../services/stripe-verification.service';
import User from '../models/user.model';
import Vendor from '../models/vendor.model';

export const initiateVerification = async (req: Request, res: Response) => {
  try {
    const { businessType, companyName } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create Stripe account based on business type
    const accountResult = businessType === 'individual' 
      ? await StripeVerificationService.createExpressAccount(user.email, 'US')
      : await StripeVerificationService.createCustomAccount({
          email: user.email,
          country: 'US',
          businessType,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          companyName
        });

    if (!accountResult.success || !accountResult.accountId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to create verification account',
        error: accountResult.error 
      });
    }

    // Update vendor record with Stripe account ID
    await Vendor.findOneAndUpdate(
      { userId },
      { 
        stripeAccountId: accountResult.accountId,
        verificationStatus: 'pending'
      },
      { upsert: true }
    );

    // Create onboarding link
    const linkResult = await StripeVerificationService.createAccountLink(
      accountResult.accountId,
      `${process.env.FRONTEND_URL}/verification/refresh`,
      `${process.env.FRONTEND_URL}/verification/complete`
    );

    if (!linkResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to create onboarding link' 
      });
    }

    res.json({
      success: true,
      onboardingUrl: linkResult.url,
      accountId: accountResult.accountId
    });

  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const checkVerificationStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ userId });
    if (!vendor?.stripeAccountId) {
      return res.status(404).json({ 
        success: false, 
        message: 'No verification account found' 
      });
    }

    const statusResult = await StripeVerificationService.getAccountStatus(vendor.stripeAccountId);
    
    if (!statusResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to check verification status' 
      });
    }

    // Update vendor verification status
    const newStatus = statusResult.isVerified ? 'verified' : 
                     statusResult.requiresAction ? 'pending' : 'rejected';
    
    await Vendor.findOneAndUpdate(
      { userId },
      { verificationStatus: newStatus }
    );

    res.json({
      success: true,
      isVerified: statusResult.isVerified,
      requiresAction: statusResult.requiresAction,
      requirements: statusResult.requirements?.currently_due || [],
      status: newStatus
    });

  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};