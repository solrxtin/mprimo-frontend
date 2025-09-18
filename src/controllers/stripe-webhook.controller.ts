import { Request, Response } from "express";
import { StripeService } from "../services/stripe.service";
import Vendor from "../models/vendor.model";
import Payment from "../models/payment.model";
import { LoggerService } from "../services/logger.service";
import Wallet from "../models/wallet.model";
import Stripe from "stripe";
import Order from "../models/order.model";
import Notification from "../models/notification.model";
import { SubscriptionService } from "../services/subscription.service";

const logger = LoggerService.getInstance();

export class StripeWebhookController {
  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers["stripe-signature"] as string;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-06-30.basil',
      });
      
      const event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      switch (event.type) {
        case "payment_intent.succeeded":
          await this.handleSuccessfulPayment(event.data.object);
          break;

        case "account.updated":
          await this.handleAccountUpdate(event.data.object);
          break;

        case "transfer.created":
          await this.handleTransferCreated(event.data.object);
          break;

        default:
          logger.info(`Unhandled Stripe event: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error("Stripe webhook error:", error);
      res.status(400).json({ error: "Webhook signature verification failed" });
    }
  }

  private static async handleSuccessfulPayment(intent: Stripe.PaymentIntent) {
    const purpose = intent.metadata?.purpose;

    if (purpose === "wallet-topup") {
      await this.processWalletTopUp(intent);
    } else if (purpose === "order-fulfillment") {
      await this.processOrderPayment(intent);
    } else {
      logger.warn(`Unhandled payment purpose: ${purpose}`);
    }
  }

  private static async handleAccountUpdate(account: any) {
    try {
      const isVerified = account.details_submitted && account.charges_enabled;
      const status = isVerified ? "verified" : "pending";
      
      const vendor = await Vendor.findOneAndUpdate(
        { stripeAccountId: account.id },
        {
          stripeVerificationStatus: status,
          kycStatus: status
        },
        { new: true }
      );

      // If vendor just got verified, add Elite subscription for 2 months
      if (isVerified && vendor && vendor.stripeVerificationStatus !== "verified") {
        await this.addEliteSubscriptionForVerifiedVendor(vendor._id.toString());
      }

      logger.info(`Stripe account updated: ${account.id} - Status: ${status}`);
    } catch (error) {
      logger.error("Error handling account update:", error);
    }
  }

  private static async addEliteSubscriptionForVerifiedVendor(vendorId: string) {
    try {
      await SubscriptionService.initializeVendorSubscription(vendorId);

      const vendor = await Vendor.findById(vendorId).select('userId');
      
      if (vendor) {
        await Notification.create({
          userId: vendor.userId,
          type: 'subscription_upgrade',
          title: 'Congratulations! Elite Plan Activated',
          message: 'Your account verification is complete! You\'ve been upgraded to Elite plan for 6 months. Enjoy premium features!',
          data: {
            redirectUrl: '/vendor/subscription',
            entityType: 'subscription'
          },
          isRead: false
        });
      }

      logger.info(`Added 6-month Elite subscription for verified vendor: ${vendorId}`);
    } catch (error) {
      logger.error('Failed to add Elite subscription for verified vendor:', error);
    }
  }

  private static async handleTransferCreated(transfer: any) {
    try {
      logger.info(
        `Payout completed: ${transfer.id} - ${transfer.amount / 100}`
      );
    } catch (error) {
      logger.error("Error handling transfer:", error);
    }
  }

  private static async processWalletTopUp(intent: any) {
    const userId = intent.metadata?.userId;
    const amount = intent.amount_received / 100;
    const currency = intent.currency;

    if (!userId) return;

    await Payment.create({
      userId,
      transactionId: intent.id,
      method: intent?.metadata?.method,
      gateway: "Stripe",
      amount,
      currency,
      status: "completed",
    });

    await Wallet.findOneAndUpdate(
      { userId },
      {
        $inc: { balance: amount },
        currency,
        $push: {
          transactions: {
            type: "credit",
            amount,
            description: "Wallet top-up via Stripe",
            date: new Date(),
          },
        },
      },
      { upsert: true }
    );

    logger.info(`Wallet funded for user: ${userId} via ${intent.id}`);
  }

  private static async processOrderPayment(intent: Stripe.PaymentIntent) {
    const userId = intent.metadata?.userId;
    const method = intent.metadata?.method;
    const orderId = intent.metadata?.orderId;
    const amount = intent.amount_received / 100;
    const currency = intent.currency;

    if (!userId || !orderId) return;

    const existingPayment = await Payment.findOne({transactionId: intent.id})
      
    if (!existingPayment) {
        Payment.create({
          userId,
          transactionId: intent.id,
          method,
          gateway: "Stripe",
          amount,
          currency,
          status: "completed",
          orderId,
        });
      } else {
        existingPayment.status = "completed";
        await existingPayment.save();
      }

    await Order.findByIdAndUpdate(orderId, {
      status: "paid",
    });

    logger.info(`Order ${orderId} marked as paid via Stripe`);
  }
}

