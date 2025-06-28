// src/routes/analytics.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';
import { authorizeRole } from '../middlewares/authorize-role.middleware';

const router = Router();

// Get dashboard analytics (admin/vendor only)
router.get(
  '/dashboard',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(['admin', 'business'])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AnalyticsController.getDashboardAnalytics(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get entity analytics (admin/vendor only)
router.get(
  '/:entityType/:entityId',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(['admin', 'business'])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AnalyticsController.getEntityAnalytics(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Track event manually (admin only)
router.post(
  '/track/:entityType/:entityId/:eventType',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(['admin'])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AnalyticsController.trackEvent(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

export default router;