import { Request, Response, RequestHandler } from 'express';
import { PushNotificationService } from '../services/push-notification.service';
import { PushSubscription } from '../models/push-subscription.model';

export class PushNotificationController {
  private pushService: PushNotificationService;

  constructor() {
    this.pushService = new PushNotificationService();
  }

  subscribe: RequestHandler = async (req, res) => {
    try {
      const subscription = req.body;
      
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        res.status(400).json({ error: 'Invalid subscription data' });
        return;
      }

      await PushSubscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          userAgent: req.headers['user-agent'],
          userId: req.userId
        },
        { upsert: true, new: true }
      );

      res.status(201).json({ message: 'Subscription saved' });
    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({ error: 'Subscription failed' });
    }
  };

  sendToAll: RequestHandler = async (req, res) => {
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
}
