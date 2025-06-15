import { NextFunction, Router, Request, Response } from "express";
import { PushNotificationController } from "../controllers/push-notification.controller";
import { verifyToken } from "../middlewares/verify-token.middleware";

const router = Router();
const controller = new PushNotificationController();

router.get(
  "/user",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    await controller.getSubscriptions(req, res, next);
  }
);

router.post(
  "/subscribe",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    await controller.subscribe(req, res, next);
  }
);

router.delete(
  "/unsubscribe/:deviceId",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    await controller.unsubscribe(req, res, next);
  }
);

router.post("/notify", controller.sendToAll);

router.post(
  "/notify/vendor",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    await controller.notifyVendor(req, res);
  }
);

export default router;
