import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';

const logger = LoggerService.getInstance();

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log when the request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.httpRequest(req, res, duration);
  });

  next();
};
