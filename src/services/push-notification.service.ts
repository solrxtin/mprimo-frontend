import webpush, { PushSubscription, WebPushError } from 'web-push';
import {PushSubscription as PushSubscriptionModel} from "../models/push-subscription.model";
import dotenv from "dotenv";

dotenv.config();

export class PushNotificationService {
  
  constructor() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL;

    if (!publicKey || !privateKey || !email) {
      throw new Error(
        'VAPID keys and email must be set in environment variables'
      );
    }

    webpush.setVapidDetails(
      `mailto:${email}`,
      publicKey,
      privateKey
    );
  }

  async sendNotification(
    subscription: PushSubscription,
    payload: any
  ): Promise<boolean> {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );
      return true;
    } catch (error) {
      if (error instanceof WebPushError) {
        // Handle expired subscriptions
        if (error.statusCode === 410) {
          // Remove subscription from your database
          await this.removeSubscription(subscription);
        }
      }
      console.error('Push notification error:', error);
      return false;
    }
  }
  private async removeSubscription(subscription: PushSubscription) {
    try {
        // Remove the subscription from database using the endpoint as unique identifier
        const result = await PushSubscriptionModel.deleteOne({
          endpoint: subscription.endpoint
        });
  
        if (result.deletedCount > 0) {
          console.log(`Subscription removed successfully: ${subscription.endpoint}`);
        } else {
          console.log(`No subscription found to remove: ${subscription.endpoint}`);
        }
      } catch (error) {
        console.error('Error removing subscription:', error);
        throw new Error('Failed to remove subscription from database');
      }
    }
}