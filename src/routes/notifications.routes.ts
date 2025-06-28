import { NextFunction, Request, Response, Router } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { getAllNotifications } from "../controllers/notification.controller";

const router = Router()

router.get(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getAllNotifications(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

export default router;