import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from '@redis/client';
import { LoggerService } from '../services/logger.service';

const logger = LoggerService.getInstance();

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.connect().catch((err) => {
  logger.error('Redis Connection Error', err);
});

// Default rate limit options
const defaultOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  },
  handler: (req: any, res: any) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      status: 429,
      message: 'Too many requests, please try again later.'
    });
  }
};

// Create different rate limiters for different purposes
export const rateLimiters = {
  // General API rate limiter
  api: rateLimit({
    ...defaultOptions,
    store: new RedisStore({
      prefix: 'rl:api:',
      sendCommand: async (...args: string[]) => redisClient.sendCommand(args),
    }),
  }),

  // Auth endpoints rate limiter (more strict)
  auth: rateLimit({
    ...defaultOptions,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 attempts per hour
    store: new RedisStore({
      prefix: 'rl:auth:',
      sendCommand: async (...args: string[]) => redisClient.sendCommand(args),
    }),
    message: {
      status: 429,
      message: 'Too many login attempts, please try again later.'
    }
  }),

  // User registration rate limiter
  register: rateLimit({
    ...defaultOptions,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3, // 3 registrations per day per IP
    store: new RedisStore({
      prefix: 'rl:register:',
      sendCommand: async (...args: string[]) => redisClient.sendCommand(args),
    }),
    message: {
      status: 429,
      message: 'Too many registration attempts, please try again tomorrow.'
    }
  }),

  // Password reset rate limiter
  passwordReset: rateLimit({
    ...defaultOptions,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    store: new RedisStore({
      prefix: 'rl:pwreset:',
      sendCommand: async (...args: string[]) => redisClient.sendCommand(args),
    }),
    message: {
      status: 429,
      message: 'Too many password reset attempts, please try again later.'
    }
  })
};

// Dynamic rate limiter creator
export const createRateLimiter = (options: Partial<typeof defaultOptions> & { name?: string }) => {
  return rateLimit({
    ...defaultOptions,
    ...options,
    store: new RedisStore({
      prefix: `rl:custom:${options.name || 'default'}:`,
      sendCommand: async (...args: string[]) => redisClient.sendCommand(args),
    })
  });
};
