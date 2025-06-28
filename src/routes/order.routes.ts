import { NextFunction, Request, Response, Router } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import {
  getAllOrders,
  getUserOrders,
  getVendorOrders,
  makeOrder,
} from "../controllers/order.controller";
import { authorizeRole } from "../middlewares/authorize-role.middleware";

const router = Router();

router.get(
  "/vendors/:vendorId",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getVendorOrders(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/user",
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

router.get(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getAllOrders(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await makeOrder(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
