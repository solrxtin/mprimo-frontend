// src/utils/audit-helpers.ts
import AuditLogService from '../services/audit-log.service';
import { Request } from 'express';

// Helper functions to add audit logging to existing controllers with minimal changes

export const logAuthEvent = async (
  action: string,
  req: Request,
  userId?: string,
  additionalData?: Record<string, any>
) => {
  await AuditLogService.log(
    action,
    'auth',
    'info',
    {
      ...additionalData,
      country: req.headers['cf-ipcountry'] || 'unknown'
    },
    req,
    undefined,
    userId
  );
};

export const logProductEvent = async (
  action: string,
  req: Request,
  productId?: string,
  additionalData?: Record<string, any>
) => {
  await AuditLogService.log(
    action,
    'product',
    'info',
    additionalData,
    req,
    productId
  );
};

export const logOrderEvent = async (
  action: string,
  req: Request,
  orderId?: string,
  level: 'info' | 'warning' | 'error' = 'info',
  additionalData?: Record<string, any>
) => {
  await AuditLogService.log(
    action,
    'order',
    level,
    additionalData,
    req,
    orderId
  );
};

export const logSecurityEvent = async (
  action: string,
  req: Request,
  level: 'warning' | 'error' = 'warning',
  additionalData?: Record<string, any>
) => {
  await AuditLogService.log(
    action,
    'security',
    level,
    additionalData,
    req
  );
};