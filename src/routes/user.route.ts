import Router, { NextFunction, Request, Response } from "express"
import { verifyToken } from "../middlewares/verify-token.middleware";
import { getUserOrders } from "../controllers/user.controller";


const router = Router()

router.get(
  "/orders",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getUserOrders(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

export default router