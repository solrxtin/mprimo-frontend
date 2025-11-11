import { Request, Response } from 'express';
import Stripe from 'stripe';
import User from '../models/user.model';
import Vendor from '../models/vendor.model';
import { StripeService } from '../services/stripe.service';
import NodeCache from 'node-cache';
import countryNameToISO from '../utils/country-name-to-iso';

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});
const cache = new NodeCache({ stdTTL: 86400 });

export const getSupportedCountries = async (req: Request, res: Response) => {
  try {
    let countries: Record<string, string> = {};
    const cachedCountries = cache.get("supportedCountries");
    if (cachedCountries) {
      let countries = cachedCountries
      return res.json({ success: true, countries });
    }
    
    let startingAfter: string | undefined = undefined;

    while (true) {
      const countrySpecs: any = await stripe.countrySpecs.list({
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter }),
      });

      countrySpecs.data.forEach((spec:any) => {
        // Stripe capabilities aren't always present as array; safer to check supported_transfer_countries
        const canTransfer =
          Array.isArray(spec.supported_transfer_countries) &&
          spec.supported_transfer_countries.length > 0;

        if (canTransfer) {
          countries[spec.id] = spec.default_currency;
        }
      });

      if (countrySpecs.has_more) {
        startingAfter = countrySpecs.data[countrySpecs.data.length - 1].id;
      } else {
        break;
      }
    }

    if (!countries["US"]) {
      throw new Error("Unable to find US country spec in Stripe");
    }

    cache.set("supportedCountries", countries)

    res.json({ success: true, countries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getCountryDetails = async (req: Request, res: Response) => {
  try {
    const { countryCode } = req.params;
    const spec = await stripe.countrySpecs.retrieve(countryCode.toUpperCase());
    
    res.json({
      success: true,
      country: spec.id,
      default_currency: spec.default_currency,
      supported_payment_currencies: spec.supported_payment_currencies,
      supported_payment_methods: spec.supported_payment_methods,
      verification_fields: spec.verification_fields,
      supported_bank_currencies: spec.supported_bank_account_currencies
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
    const accountCountry = vendor.businessInfo?.address?.country;

    if (!accountCountry) {
      return res.status(400).json({ success: false, message: 'Can\'t find Vendo\'s country' });
    }

    // Create Stripe Custom account for admin-controlled payouts
    const account = await stripe.accounts.create({
      type: 'custom',
      country: countryNameToISO[accountCountry] || country,
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: businessType === 'business' ? 'company' : 'individual',
      ...(businessType === 'company' && companyName && {
        company: { name: companyName }
      }),
      ...(businessType === 'individual' && {
        individual: {
          email: user.email,
          first_name: user.profile?.firstName,
          last_name: user.profile?.lastName,
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

export const getUploadRequirements = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ userId });
    if (!vendor?.stripeAccountId) {
      return res.status(404).json({ success: false, message: 'No Stripe account found' });
    }

    const account = await stripe.accounts.retrieve(vendor.stripeAccountId);
    const requirements = account.requirements?.currently_due || [];
    
    const documentTypes = {
      individual: ['identity_document', 'address_document'],
      company: ['business_license', 'tax_document', 'bank_statement']
    };

    res.json({
      success: true,
      business_type: account.business_type,
      required_documents: documentTypes[account.business_type as keyof typeof documentTypes] || [],
      missing_fields: requirements,
      country: account.country
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { documentType, fileData, fileName } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ userId });
    if (!vendor?.stripeAccountId) {
      return res.status(404).json({ success: false, message: 'No Stripe account found' });
    }

    // Upload file to Stripe
    const file = await stripe.files.create({
      purpose: 'identity_document',
      file: {
        data: Buffer.from(fileData, 'base64'),
        name: fileName,
        type: 'application/octet-stream',
      },
    });

    res.json({
      success: true,
      fileId: file.id,
      message: 'Document uploaded successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePersonalInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { firstName, lastName, email, phone, dob, address } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ userId });
    if (!vendor?.stripeAccountId) {
      return res.status(404).json({ success: false, message: 'No Stripe account found' });
    }

    await stripe.accounts.update(vendor.stripeAccountId, {
      individual: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        dob: {
          day: parseInt(dob.split('-')[2]),
          month: parseInt(dob.split('-')[1]),
          year: parseInt(dob.split('-')[0])
        },
        address: {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country
        }
      }
    });

    res.json({ success: true, message: 'Personal information updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBusinessInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { companyName, taxId, address, phone, url, mcc, representative, owners } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ userId });
    if (!vendor?.stripeAccountId) {
      return res.status(404).json({ success: false, message: 'No Stripe account found' });
    }

    const updateData: any = {};
    
    if (companyName || taxId || address || phone) {
      updateData.company = {};
      if (companyName) updateData.company.name = companyName;
      if (taxId) updateData.company.tax_id = taxId;
      if (phone) updateData.company.phone = phone;
      if (address) updateData.company.address = address;
      if (owners !== undefined) updateData.company.owners_provided = owners.length > 0;
    }
    
    if (url || mcc) {
      updateData.business_profile = {};
      if (url) updateData.business_profile.url = url;
      if (mcc) updateData.business_profile.mcc = mcc;
    }
    
    if (representative) {
      updateData.representative = representative;
    }
    
    if (owners && owners.length > 0) {
      for (const owner of owners) {
        await stripe.accounts.createPerson(vendor.stripeAccountId, owner);
      }
    }

    await stripe.accounts.update(vendor.stripeAccountId, updateData);

    res.json({ success: true, message: 'Business information updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBankDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { accountNumber, routingNumber, accountHolderName, accountType } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ userId });
    if (!vendor?.stripeAccountId) {
      return res.status(404).json({ success: false, message: 'No Stripe account found' });
    }

    const bankAccount = await stripe.accounts.createExternalAccount(vendor.stripeAccountId, {
      external_account: {
        object: 'bank_account',
        country: 'US',
        currency: 'usd',
        account_number: accountNumber,
        routing_number: routingNumber,
        account_holder_name: accountHolderName,
        account_holder_type: accountType
      }
    });

    res.json({ 
      success: true, 
      message: 'Bank details updated successfully',
      bankAccountId: bankAccount.id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitDocuments = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { documents } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ userId });
    if (!vendor?.stripeAccountId) {
      return res.status(404).json({ success: false, message: 'No Stripe account found' });
    }

    // Update account with document file IDs
    const updateData: any = {};
    
    if (documents.identity_document_front) {
      updateData['individual.verification.document.front'] = documents.identity_document_front;
    }
    if (documents.identity_document_back) {
      updateData['individual.verification.document.back'] = documents.identity_document_back;
    }
    if (documents.address_document) {
      updateData['individual.verification.additional_document.front'] = documents.address_document;
    }

    await stripe.accounts.update(vendor.stripeAccountId, updateData);

    // Update vendor status
    vendor.stripeVerificationStatus = 'pending';
    await vendor.save();

    res.json({ 
      success: true, 
      message: 'Documents submitted successfully for verification'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptTos = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { userAgent } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ userId });
    if (!vendor?.stripeAccountId) {
      return res.status(404).json({ success: false, message: 'No Stripe account found' });
    }

    await stripe.accounts.update(vendor.stripeAccountId, {
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: ip,
        user_agent: userAgent || req.headers['user-agent']
      }
    });

    res.json({ success: true, message: 'Terms of service accepted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'account.updated':
        const account = event.data.object;
        
        // Find vendor by Stripe account ID
        const vendor = await Vendor.findOne({ stripeAccountId: account.id });
        if (!vendor) {
          console.log(`No vendor found for account ${account.id}`);
          break;
        }

        // Update verification status based on account state
        let newStatus = 'pending';
        if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
          newStatus = 'verified';
          vendor.kycStatus = 'verified';
          await vendor.save();
        } else if (account.requirements?.disabled_reason) {
          newStatus = 'rejected';
        }

        // Only update if status changed
        if (vendor.stripeVerificationStatus !== newStatus) {
          vendor.stripeVerificationStatus = newStatus;
          await vendor.save();
          console.log(`Updated vendor ${vendor._id} status to ${newStatus}`);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: error.message });
  }
};