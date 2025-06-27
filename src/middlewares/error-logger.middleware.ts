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
    params: req.params,
  });

  // More specific error handling
  const statusCode = error.name === "ValidationError"
    ? 400 // Bad Request
    : error.name === "UnauthorizedError"
    ? 401 // Unauthorized
    : 500; // Internal Server Error (default)

  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message,
  });
};
