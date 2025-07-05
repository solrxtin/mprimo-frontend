// src/controllers/audit-log.controller.ts
import { Request, Response, NextFunction } from 'express';
import AuditLogService from '../services/audit-log.service';


export class AuditLogController {
  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        resource,
        action,
        level,
        startDate,
        endDate
      } = req.query;

      const filters: any = {};
      if (userId) filters.userId = userId as string;
      if (resource) filters.resource = resource as string;
      if (action) filters.action = action as string;
      if (level) filters.level = level as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await AuditLogService.getAuditLogs(
        Number(page),
        Number(limit),
        filters
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AuditLogService.getAuditStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuditLogController;