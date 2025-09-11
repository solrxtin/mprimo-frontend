
import { Request } from "express";
import AuditLog from "../models/audit-log.model";
import { LoggerService } from "../services/logger.service";


const logger = LoggerService.getInstance();

interface LogOptions {
  req: Request;
  action: string;
  resource: string;
  resourceId?: string;
  level?: "info" | "warning" | "error";
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

export const logAdminAction = async ({
  req,
  action,
  resource,
  resourceId,
  level = "info",
  details,
  metadata = {},
}: LogOptions) => {
  try {
    const user = req.user;

    await AuditLog.create({
      userId: req.userId,
      action,
      resource,
      resourceId,
      level,
      details,
      metadata,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
    logger.error("Failed to write audit log:", err);
  }
};
