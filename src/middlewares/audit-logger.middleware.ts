// src/middlewares/audit-logger.middleware.ts
import { Request, Response, NextFunction } from 'express';
import AuditLogService from '../services/audit-log.service';

// Middleware to automatically log sensitive operations
export const auditLogger = (action: string, resource: string, level: 'info' | 'warning' | 'error' = 'info') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(body: any) {
      // Log the operation after successful response
      if (res.statusCode < 400) {
        AuditLogService.log(
          action,
          resource,
          level,
          {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            params: req.params,
            query: req.query,
            statusCode: res.statusCode
          },
          req,
          req.params.id || body?.id || body?.data?.id
        ).catch(err => console.error('Audit logging failed:', err));
      }
      
      // Call original json method
      return originalJson.call(this, body);
    };
    
    next();
  };
};

// Pre-defined audit loggers for common operations
export const auditAuth = auditLogger('AUTH_OPERATION', 'auth', 'info');
export const auditProduct = auditLogger('PRODUCT_OPERATION', 'product', 'info');
export const auditOrder = auditLogger('ORDER_OPERATION', 'order', 'info');
export const auditSensitive = auditLogger('SENSITIVE_OPERATION', 'system', 'warning');