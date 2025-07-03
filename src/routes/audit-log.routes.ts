// src/routes/audit-log.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { AuditLogController } from '../controllers/audit-log.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';
import { authorizeRole } from '../middlewares/authorize-role.middleware';

const router = Router();

// Get audit logs (admin only)
router.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(['admin'])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AuditLogController.getAuditLogs(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get audit statistics (admin only)
router.get(
  '/stats',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(['admin'])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AuditLogController.getAuditStats(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

export default router;