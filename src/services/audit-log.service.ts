// src/services/audit-log.service.ts
import AuditLog, { IAuditLog } from '../models/audit-log.model';
import { Request } from 'express';
import mongoose from 'mongoose';

export class AuditLogService {
  static async log(
    action: string,
    resource: string,
    level: 'info' | 'warning' | 'error',
    details: Record<string, any>,
    req?: Request,
    resourceId?: string,
    userId?: string | mongoose.Types.ObjectId
  ) {
    try {
      const logData: Partial<IAuditLog> = {
        action,
        resource,
        level,
        details,
        resourceId,
        timestamp: new Date()
      };

      if (req) {
        logData.ipAddress = req.ip || req.connection.remoteAddress;
        logData.userAgent = req.headers['user-agent'];
        logData.userId = req.userId || userId;
      } else if (userId) {
        logData.userId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
      }

      await AuditLog.create(logData);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  static async getAuditLogs(
    page = 1,
    limit = 50,
    filters: {
      userId?: string;
      resource?: string;
      action?: string;
      level?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters.userId) query.userId = new mongoose.Types.ObjectId(filters.userId);
    if (filters.resource) query.resource = filters.resource;
    if (filters.action) query.action = filters.action;
    if (filters.level) query.level = filters.level;
    
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'email name role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getAuditStats() {
    const [
      totalLogs,
      errorLogs,
      warningLogs,
      infoLogs,
      recentActivity
    ] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ level: 'error' }),
      AuditLog.countDocuments({ level: 'warning' }),
      AuditLog.countDocuments({ level: 'info' }),
      AuditLog.aggregate([
        {
          $match: {
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      totalLogs,
      errorLogs,
      warningLogs,
      infoLogs,
      recentActivity
    };
  }
}

export default AuditLogService;