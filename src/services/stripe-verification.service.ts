import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!);
export class StripeVerificationService {
  // Create Express Account for vendor verification
  static async createExpressAccount(email: string, country: string = "US") {
    try {
      const account = await stripe.accounts.create({
        type: "express",
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      return {
        success: true,
        accountId: account.id,
        account,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create account link for onboarding
  static async createAccountLink(
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

      return {
        success: true,
        url: accountLink.url,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Check account verification status
  static async getAccountStatus(accountId: string) {
    try {
      const account = await stripe.accounts.retrieve(accountId);

      return {
        success: true,
        isVerified: account.details_submitted && account.charges_enabled,
        requiresAction: (account.requirements?.currently_due?.length ?? 0) > 0,
        requirements: {
          currently_due: account.requirements?.currently_due || [],
          pending_verification:
            account.requirements?.pending_verification || [],
          past_due: account.requirements?.past_due || [],
        },
        account,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create Custom Account for more control
  static async createCustomAccount(userData: {
    email: string;
    country: string;
    businessType: "individual" | "company";
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }) {
    try {
      const accountData: any = {
        type: "custom",
        country: userData.country,
        email: userData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: userData.businessType,
      };

      if (userData.businessType === "individual") {
        accountData.individual = {
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
        };
      } else {
        accountData.company = {
          name: userData.companyName,
        };
      }

      const account = await stripe.accounts.create(accountData);

      return {
        success: true,
        accountId: account.id,
        account,
      };
    } catch (error: any) {
      console.error("Error creating custom account:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
