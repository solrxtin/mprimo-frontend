import Stripe from "stripe";
import { LoggerService } from "./logger.service";

const logger = LoggerService.getInstance();
const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export class StripeService {
  // Create payment intent for multiple payment methods
  static async createPaymentIntent(
    amount: number,
    currency: string = "usd",
    paymentMethods: string[] = ["card", "apple_pay"],
    metadata: Record<string, string> = {}
  ) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        payment_method_types: paymentMethods,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      logger.error("Stripe payment intent creation failed:", error);
      throw error;
    }
  }

  // Create Stripe Connect account for vendor KYC
  static async createConnectAccount(vendorData: any) {
    try {
      const account = await stripe.accounts.create({
        type: "express",
        country: vendorData.country || "US",
        email: vendorData.email,
        business_type:
          vendorData.accountType === "business" ? "company" : "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      return account;
    } catch (error) {
      logger.error("Stripe Connect account creation failed:", error);
      throw error;
    }
  }

  // Create onboarding link for vendor KYC
  static async createOnboardingLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
  ) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      });

      return accountLink.url;
    } catch (error) {
      logger.error("Stripe onboarding link creation failed:", error);
      throw error;
    }
  }

  // Check vendor verification status
  static async getAccountStatus(accountId: string) {
    try {
      const account = await stripe.accounts.retrieve(accountId);

      return {
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements,
      };
    } catch (error) {
      logger.error("Stripe account status check failed:", error);
      throw error;
    }
  }

  // Process payout to vendor
  static async createPayout(
    accountId: string,
    amount: number,
    currency: string = "usd"
  ) {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency,
        destination: accountId,
      });

      return transfer;
    } catch (error) {
      logger.error("Stripe payout failed:", error);
      throw error;
    }
  }

  // Retrieve payment intent
  static async retrievePaymentIntent(paymentIntentId: string) {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logger.error("Stripe payment intent retrieval failed:", error);
      throw error;
    }
  }

  // Create Stripe customer if needed
  static async createCustomer(name: string, email: string) {
    try {
      return await stripe.customers.create({ name, email });
    } catch (error) {
      logger.error("Stripe customer creation failed:", error);
      throw error;
    }
  }

  // Create bank transfer invoice with customer_balance
  static async createBankTransferInvoice(
    customerId: string,
    description: string = "Wallet top-up"
  ) {
    try {
      const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: "send_invoice",
        payment_settings: {
          payment_method_types: ["customer_balance"],
        },
        description,
        metadata: { purpose: "wallet_topup" },
      });
      const invoiceId = invoice.id;

      if (!invoiceId) {
        throw new Error("Invoice ID not found");
      }

      // Finalize invoice to generate funding instructions
      return await stripe.invoices.finalizeInvoice(invoiceId);
    } catch (error) {
      logger.error("Stripe bank transfer invoice creation failed:", error);
      throw error;
    }
  }

  // Retrieve bank transfer funding instructions
  static async getFundingInstructions(invoiceId: string) {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      const fundingInstructions = (invoice.payment_settings as any)
        ?.customer_balance?.funding_instructions;
      return fundingInstructions || null;
    } catch (error) {
      logger.error("Stripe funding instructions retrieval failed:", error);
      throw error;
    }
  }

  // Verify webhook signature
  static verifyWebhook(payload: string, signature: string) {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      logger.error("Stripe webhook verification failed:", error);
      throw error;
    }
  }
}
