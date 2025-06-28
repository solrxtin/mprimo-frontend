import webpush, { WebPushError } from "web-push";
import {
  PushSubscription as PushSubscriptionModel,
  IPushSubscription,
} from "../models/push-subscription.model";
import dotenv from "dotenv";
import { socketService } from "../index";
import { INotification } from "../types/notification.type";
import { Types } from "mongoose";

dotenv.config();

// Define status message type for type safety
type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export class PushNotificationService {
  
  constructor() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL;

    if (!publicKey || !privateKey || !email) {
      throw new Error(
        "VAPID keys and email must be set in environment variables"
      );
    }

    webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  }

  async sendNotification(
    subscription: webpush.PushSubscription,
    payload: any
  ): Promise<boolean> {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
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
      console.error("Push notification error:", error);
      return false;
    }
  }

  private async removeSubscription(subscription: webpush.PushSubscription) {
    try {
      // Remove the subscription from database using the endpoint as unique identifier
      const result = await PushSubscriptionModel.deleteOne({
        endpoint: subscription.endpoint,
      });

      if (result.deletedCount > 0) {
        console.log(
          `Subscription removed successfully: ${subscription.endpoint}`
        );
      } else {
        console.log(
          `No subscription found to remove: ${subscription.endpoint}`
        );
      }
    } catch (error) {
      console.error("Error removing subscription:", error);
      throw new Error("Failed to remove subscription from database");
    }
  }

  static async notifyVendor(
    userId: string,
    vendorId: Types.ObjectId,
    event: string,
    notification: INotification
  ) {
    try {
      // 1. Send via Socket.IO for real-time notification if vendor is online
      socketService.notifyVendor(vendorId, { event, notification });

      // 2. Send via Web Push for offline notification
      const subscriptions = await PushSubscriptionModel.find({
        userId: userId,
      });

      if (subscriptions.length > 0) {
        const payload = JSON.stringify({
          notification,
        });

        const sendPromises = subscriptions.map((sub) => {
          // Parse the subscription string from the database
          const subscriptionData = JSON.parse(sub.endpoint);

          return webpush
            .sendNotification(subscriptionData, payload)
            .catch((error) => {
              // If subscription is expired or invalid, remove it
              if (error.statusCode === 410) {
                return PushSubscriptionModel.findByIdAndDelete(sub._id);
              }
              console.error("Error sending push notification:", error);
            });
        });

        await Promise.all(sendPromises);
      }

      return true;
    } catch (error) {
      console.error("Error notifying vendor:", error);
      return false;
    }
  }

  static async notifyVendorWithSubscription(
    subscription: IPushSubscription,
    event: string,
    notification: INotification
  ) {
    try {
      const payload = JSON.stringify({
        notification,
      });

      await webpush.sendNotification(subscription, payload);
      return true;
    } catch (error) {
      console.error("Error notifying vendor:", error);
      return false;
    }
  }

  static async notifyUser(
    userId: string,
    event: string,
    notification: INotification
  ) {
    try {
      // 1. Send via Socket.IO for real-time notification if user is online
      socketService.notifyUser(userId, { event, notification });

      const subscriptions = await PushSubscriptionModel.find({
        userId: userId,
      });

      if (subscriptions.length > 0) {
        const payload = JSON.stringify({
          notification,
        });

        const sendPromises = subscriptions.map((sub) => {
          // Parse the subscription string from the database
          const subscriptionData = JSON.parse(sub.endpoint);

          return webpush
            .sendNotification(subscriptionData, payload)
            .catch((error) => {
              // If subscription is expired or invalid, remove it
              if (error.statusCode === 410) {
                return PushSubscriptionModel.findByIdAndDelete(sub._id);
              }
              console.error("Error sending push notification:", error);
            });
        });

        await Promise.all(sendPromises);
      }

      return true;
    } catch (error) {
      console.error("Error notifying user:", error);
      return false;
    }
  }

  // Instance methods for notifications (kept for backward compatibility)
  // static async notifyProductListed(userId: string, productId: string, productName: string) {
  //   return this.notifyVendor(
  //     userId,
  //     'Product Listed Successfully',
  //     `Your product "${productName}" is now live on the marketplace`,
  //     {
  //       type: 'product_listed',
  //       productId,
  //       url: `/vendor/products/${productId}`
  //     }
  //   );
  // }

  // static async notifyProductOrdered(userId: string, orderId: string, productName: string, quantity: number) {
  //   return this.notifyVendor(
  //     userId,
  //     'New Order Received',
  //     `You received an order for ${quantity}x "${productName}"`,
  //     {
  //       type: 'product_ordered',
  //       orderId,
  //       url: `/vendor/orders/${orderId}`
  //     }
  //   );
  // }

  // static async notifyOrderStatusUpdate(userId: string, orderId: string, status: string) {
  //   const statusMessages: Record<OrderStatus, string> = {
  //     'processing': 'Your order is being processed',
  //     'shipped': 'Your order has been shipped',
  //     'delivered': 'Your order has been delivered',
  //     'cancelled': 'Your order has been cancelled'
  //   };

  //   // Use type assertion to handle the status string
  //   const message = statusMessages[status as OrderStatus] ||
  //                   `Your order status has been updated to ${status}`;

  //   return this.notifyVendor(
  //     userId,
  //     `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
  //     message,
  //     {
  //       type: 'order_status',
  //       orderId,
  //       status,
  //       url: `/orders/${orderId}`
  //     }
  //   );
  // }
}
