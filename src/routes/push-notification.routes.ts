import { Router } from 'express';
import { PushNotificationController } from '../controllers/push-notification.controller';

const router = Router();
const controller = new PushNotificationController();

router.post('/subscribe', controller.subscribe);
router.post('/notify', controller.sendToAll);

export default router;
