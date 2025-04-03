import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { corsConfig, corsDevConfig } from '../config/cors.config';
import { LoggerService } from '../services/logger.service';
import dotenv from "dotenv";

dotenv.config()

const logger = LoggerService.getInstance();

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Use different CORS settings based on environment
  const corsSettings = process.env.NODE_ENV === 'production' ? corsConfig : corsDevConfig;

  // Log CORS requests in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('CORS Request', {
      origin: req.headers.origin,
      method: req.method,
      path: req.path
    });
  }

  return cors(corsSettings)(req, res, next);
};
