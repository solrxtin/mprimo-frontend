import { Request, Response } from 'express';
import Stripe from 'stripe';
import User from '../models/user.model';
import Vendor from '../models/vendor.model';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export const initiateStripeVerification = async (req: Request, res: Response) => {
  try {
    const { businessType, companyName, country } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    // Get country from vendor business address or default to US
    const accountCountry = country || vendor.businessInfo?.address?.country || 'US';

    // Create Stripe Custom account for admin-controlled payouts
    const account = await stripe.accounts.create({
      type: 'custom',
      country: accountCountry,
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: businessType === 'business' ? 'company' : 'individual',
      ...(businessType === 'company' && companyName && {
        company: { name: companyName }
      }),
      ...(businessType === 'individual' && {
        individual: {
          email: user.email,
          first_name: user.profile.firstName,
          last_name: user.profile.lastName,
        }
      })
    });

    // Update vendor with Stripe account ID
    vendor.stripeAccountId = account.id;
    vendor.stripeVerificationStatus = 'pending';
    await vendor.save();

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/vendor/verification/refresh`,
      return_url: `${process.env.FRONTEND_URL}/vendor/verification/complete`,
      type: 'account_onboarding',
    });

    res.json({
      success: true,
      onboardingUrl: accountLink.url,
      accountId: account.id
    });

  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const checkStripeVerificationStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ userId });
    if (!vendor?.stripeAccountId) {
      return res.status(404).json({ 
        success: false, 
        message: 'No Stripe account found' 
      });
    }

    const account = await stripe.accounts.retrieve(vendor.stripeAccountId);
    
    const isVerified = account.details_submitted && account.charges_enabled;
    const requiresAction = (account.requirements?.currently_due?.length || 0) > 0;
    
    // Update vendor status
    const newStatus = isVerified ? 'verified' : requiresAction ? 'pending' : 'rejected';
    vendor.stripeVerificationStatus = newStatus;
    await vendor.save();

    res.json({
      success: true,
      isVerified,
      requiresAction,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || []
      },
      status: newStatus
    });

  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getVerificationRequirements = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ userId });
    if (!vendor?.stripeAccountId) {
      return res.status(404).json({ 
        success: false, 
        message: 'No Stripe account found' 
      });
    }

    const account = await stripe.accounts.retrieve(vendor.stripeAccountId);

    res.json({
      success: true,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || [],
        pending_verification: account.requirements?.pending_verification || [],
        disabled_reason: account.requirements?.disabled_reason || null
      },
      country: account.country,
      business_type: account.business_type,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled
    });

  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};