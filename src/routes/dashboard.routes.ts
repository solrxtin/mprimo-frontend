// GET /api/v1/dashboard/vendors/:vendorId/analytics?range=1month

import { NextFunction, Request, Response, Router } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { authorizeRole } from "../middlewares/authorize-role.middleware";
import { getVendorDashboard } from "../controllers/dashboard.controller";


const router = Router()

router.get(
  "/vendors/:vendorId/analytics",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getVendorDashboard(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

export default router;