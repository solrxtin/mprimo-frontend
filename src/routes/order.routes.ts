import { NextFunction, Request, Response, Router } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import {
  getAllOrders,
  getOrder,
  getVendorOrders,
  makeOrder,
  changeShippingAddress,
  cancelOrder,
  refundOrder,
  getRefunds,
  getOrderStats,
  OrderController,
  getVendorOrderMetrics
} from "../controllers/order.controller";
import { authorizeRole, authorizeVendor } from "../middlewares/authorize-role.middleware";

const router = Router();

router.get(
  "/vendors/:vendorId",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
 authorizeVendor,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getVendorOrders(req, res, next);
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

router.get(
  "/:orderId",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getOrder(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);


router.post(
  "/",
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await makeOrder(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Update shipping address
router.patch(
  "/:id/shipping",
  verifyToken,
  changeShippingAddress
);

// Cancel order
router.patch(
  "/:orderId/cancel",
  verifyToken,
  cancelOrder
);

// Refund order
router.post(
  "/:orderId/refund",
  verifyToken,
  authorizeRole(["admin"]),
  refundOrder
);

// Get refunds
router.get(
  "/refunds/all",
  verifyToken,
  authorizeRole(["admin"]),
  getRefunds
);

// Get order stats
router.get(
  "/stats/all",
  verifyToken,
  authorizeRole(["admin"]),
  getOrderStats
);

// Get vendor order stats
router.get(
  "/:vendorId/metrics",
  verifyToken,
  authorizeVendor,
  getVendorOrderMetrics
);

// Update order status
router.patch(
  "/:orderId/status",
  verifyToken,
  authorizeVendor,
  OrderController.updateOrderStatus
);

export default router;
