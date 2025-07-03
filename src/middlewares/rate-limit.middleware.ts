// src/middlewares/rate-limit.middleware.ts
import { Request, Response, NextFunction } from 'express';
import redisService from '../services/redis.service';

export const createRateLimit = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100,
  message: string = 'Too many requests, please try again later'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `rate_limit:${req.ip}:${req.route?.path || req.path}`;
      
      // Get current count
      const current = await redisService.redisClient?.get(key);
      const count = current ? parseInt(current) : 0;
      
      if (count >= maxRequests) {
        res.status(429).json({
          success: false,
          message,
          retryAfter: Math.ceil(windowMs / 1000)
        });
        return;
      }
      
      // Increment counter
      if (count === 0) {
        await redisService.redisClient?.set(key, '1', 'EX', Math.ceil(windowMs / 1000));
      } else {
        await redisService.redisClient?.incr(key);
      }
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - count - 1).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
      });
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Continue on error
    }
  };
};

// Predefined rate limiters
export const strictRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many sensitive operations, please wait');
export const moderateRateLimit = createRateLimit(15 * 60 * 1000, 20, 'Rate limit exceeded');
export const standardRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many requests');