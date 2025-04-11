import rateLimit, { Store, MemoryStore } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from '@redis/client';
import { LoggerService } from '../services/logger.service';

const logger = LoggerService.getInstance();

// Configurable store setup
const useRedis = process.env.RATE_LIMIT_STORE === 'redis';
let redisClient: ReturnType<typeof createClient> | undefined;

if (useRedis) {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error', err);
  });

  (async () => {
    try {
      await redisClient.connect();
    } catch (err) {
      logger.error('Redis Connection Error', err);
    }
  })();
}


const getStore = (prefix?: string) => {
  if (useRedis && redisClient) {
    return new RedisStore({
      prefix: prefix ? `rl:${prefix}:` : 'rl:',
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    });
  }
  // Default to MemoryStore
  return new MemoryStore();
};

// Default options (now store-independent)
interface DefaultOptions {
  windowMs: number;
  max: number;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  store: Store | undefined;
  message: {
    status: number;
    message: string;
  };
  handler: (req: any, res: any) => void;
}

const defaultOptions: DefaultOptions = {
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(), // Default store
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

// Rate limiters with configurable stores
export const rateLimiters = {
  api: rateLimit({
    ...defaultOptions,
    store: getStore('api')
  }),

  auth: rateLimit({
    ...defaultOptions,
    windowMs: 60 * 60 * 1000,
    max: 5,
    store: getStore('auth'),
    message: {
      status: 429,
      message: 'Too many login attempts, please try again later.'
    }
  }),

  // ... other limiters (same pattern)
};

// Dynamic limiter with configurable store
interface RateLimiterOptions {
  name?: string;
  windowMs?: number;
  max?: number;
  message?: { status: number; message: string };
  handler?: (req: any, res: any) => void;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export const createRateLimiter = (options: RateLimiterOptions) => {
  return rateLimit({
    ...defaultOptions,
    ...options,
    store: getStore(options.name || 'custom')
  });
};