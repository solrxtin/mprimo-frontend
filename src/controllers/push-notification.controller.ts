import { Request, Response, RequestHandler, NextFunction } from 'express';
import { PushNotificationService } from '../services/push-notification.service';
import { PushSubscription } from '../models/push-subscription.model';

export class PushNotificationController {
  private pushService: PushNotificationService;

  constructor() {
    this.pushService = new PushNotificationService();
  }

  subscribe: RequestHandler = async (req: Request, res: Response) => {
    try {
      const {subscription} = req.body;
      console.log(subscription)
      
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        res.status(400).json({ error: 'Invalid subscription data' });
        return;
      }
  
      // Generate a device ID from user agent or use provided one
      const deviceId = req.body.deviceId || 
        Buffer.from(req.headers['user-agent'] || 'unknown').toString('base64').substring(0, 24);
  
      await PushSubscription.findOneAndUpdate(
        { 
          endpoint: subscription.endpoint,
          deviceId: deviceId
        },
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          userAgent: req.headers['user-agent'],
          userId: req.userId,
          deviceId: deviceId,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
  
      res.status(201).json({ 
        message: 'Subscription saved',
        deviceId: deviceId
      });
    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({ error: 'Subscription failed' });
    }
  };
  
  unsubscribe: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      
      if (!deviceId) {
        res.status(400).json({ error: 'Device ID is required' });
        return;
      }
      
      const result = await PushSubscription.deleteOne({ 
        deviceId,
        userId: req.userId
      });
      
      if (result.deletedCount > 0) {
        res.status(200).json({ message: 'Subscription removed successfully' });
      } else {
        res.status(404).json({ error: 'Subscription not found' });
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  };
  
  getSubscriptions: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deviceId } = req.query;
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      const query: any = { userId };
      
      // If deviceId is provided, get only that device's subscription
      if (deviceId) {
        query.deviceId = deviceId;
      }
      
      const subscriptions = await PushSubscription.find(query)
        .select('-keys') // Don't send sensitive key data to client
        .sort({ lastUpdated: -1 });
      
      res.json({
        subscriptions: subscriptions.map(sub => ({
          id: sub._id,
          deviceId: sub.deviceId,
          userAgent: sub.userAgent,
          lastUpdated: sub.lastUpdated
        }))
      });
    } catch (error) {
      console.error('Get subscriptions error:', error);
      res.status(500).json({ error: 'Failed to get subscriptions' });
    }
  };

  sendToAll: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { title, body } = req.body;
      
      const subscriptions = await PushSubscription.find();
      const notifications = subscriptions.map(sub => 
        this.pushService.sendNotification(sub, {
          title,
          body,
          icon: '/icon.png',
          badge: '/badge.png',
          timestamp: new Date().getTime()
        })
      );

      await Promise.all(notifications);
      res.json({ message: 'Notifications sent' });
    } catch (error) {
      console.error('Send notification error:', error);
      res.status(500).json({ error: 'Failed to send notifications' });
    }
  };

  async notifyVendor(req: Request, res: Response) {
    try {
      const { vendorId, event, data } = req.body;
      
      if (!vendorId || !event) {
        return res.status(400).json({
          success: false,
          message: 'Vendor ID and event type are required'
        });
      }
      
      let result;
      
      switch (event) {
        case 'product_listed':
          result = await PushNotificationService.notifyProductListed(
            vendorId,
            data.productId,
            data.productName
          );
          break;
        case 'product_ordered':
          result = await PushNotificationService.notifyProductOrdered(
            vendorId,
            data.orderId,
            data.productName,
            data.quantity
          );
          break;
        case 'order_status':
          result = await PushNotificationService.notifyOrderStatusUpdate(
            vendorId,
            data.orderId,
            data.status
          );
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid event type'
          });
      }
      
      if (result) {
        return res.status(200).json({
          success: true,
          message: 'Notification sent successfully'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send notification'
        });
      }
    } catch (error) {
      console.error('Error sending vendor notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}
