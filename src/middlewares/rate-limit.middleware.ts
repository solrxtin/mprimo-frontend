import { Request, Response, NextFunction } from 'express';
import { createRateLimiter, rateLimiters } from '../config/rate-limit.config';


export const rateLimitMiddleware = {
  // Apply general API rate limiting
  api: (req: Request, res: Response, next: NextFunction) => {
    rateLimiters.api(req, res, next);
  },

  // Apply authentication rate limiting
  auth: (req: Request, res: Response, next: NextFunction) => {
    rateLimiters.auth(req, res, next);
  },

  // Apply registration rate limiting
  register: (req: Request, res: Response, next: NextFunction) => {
    rateLimiters.register(req, res, next);
  },

  // Apply password reset rate limiting
  passwordReset: (req: Request, res: Response, next: NextFunction) => {
    rateLimiters.passwordReset(req, res, next);
  },

  // Custom rate limiter for specific routes
  custom: (options: any) => {
    const limiter = createRateLimiter(options);
    return (req: Request, res: Response, next: NextFunction) => {
      limiter(req, res, next);
    };
  }
};

