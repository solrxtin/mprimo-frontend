import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';

const logger = LoggerService.getInstance();

export const errorLogger = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled Error', error, {
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    params: req.params
  });

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error'
      : error.message
  });
};
