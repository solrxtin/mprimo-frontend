import { Router, Response, Request, NextFunction } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import * as vendorPayoutController from "../controllers/vendor-payout.controller";
import { authorizeRole } from "../middlewares/authorize-role.middleware";

const router = Router();

// Vendor Payout Routes
router.post(
  "/:vendorId/request",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  vendorPayoutController.requestPayout
);
router.get(
  "/:vendorId/payouts",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  vendorPayoutController.getVendorPayouts
);
router.get(
  "/:vendorId/eligible-orders",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  vendorPayoutController.getPayoutEligibleOrders
);

export default router;
