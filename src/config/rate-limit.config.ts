// import { Redis } from "@upstash/redis";
import rateLimit, { Store, ClientRateLimitInfo } from "express-rate-limit";
import { LoggerService } from "../services/logger.service";
import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

const logger = LoggerService.getInstance();

const redisClient = new Redis(process.env.UPSTASH_REDIS_REST_URL!);
redisClient.on("error", (err) => {
  logger.error("Redis error:", err);
  console.error("Redis error:", err);
});

async function testRedis() {
  await redisClient.set("test-key", "Hello, Upstash!");
  const value = await redisClient.get("test-key");
  console.log("Stored value:", value);
}

testRedis();

// Default rate limit options
const defaultOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
  handler: (req: any, res: any) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      status: 429,
      message: "Too many requests, please try again later.",
    });
  },
};

// Implement the Store interface
class RedisStore implements Store {
  async increment(key: string): Promise<ClientRateLimitInfo> {
    const current = await redisClient.get(key);
    const currentValue = typeof current === "string" ? parseInt(current, 10) : 0;
    const newValue = currentValue + 1;

    // Use "EX" instead of "ex"
    await redisClient.set(key, newValue.toString(), "EX", defaultOptions.windowMs / 1000);

    return {
      totalHits: newValue,
      resetTime: new Date(Date.now() + defaultOptions.windowMs),
    };
  }

  async decrement(key: string): Promise<void> {
    const current = await redisClient.get(key);
    const currentValue = typeof current === "string" ? parseInt(current, 10) : 0;
    const newValue = Math.max(currentValue - 1, 0);

    // Use "EX" instead of "ex"
    await redisClient.set(key, newValue.toString(), "EX", defaultOptions.windowMs / 1000);
  }

  async resetKey(key: string): Promise<void> {
    await redisClient.del(key);
  }
}

// Export rate limiters
export const rateLimiters = {
  api: rateLimit({
    ...defaultOptions,
    store: new RedisStore(),
  }),
  auth: rateLimit({
    ...defaultOptions,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per windowMs
    store: new RedisStore(),
    message: {
      status: 429,
      message: "Too many login attempts, please try again later.",
    },
  }),
  register: rateLimit({
    ...defaultOptions,
    windowMs: 24 * 60 * 60 * 1000, // 1 day
    max: 3, // Limit each IP to 3 requests per windowMs
    store: new RedisStore(),
    message: {
      status: 429,
      message: "Too many registration attempts, please try again later.",
    },
  }),
  passwordReset: rateLimit({
    ...defaultOptions,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 requests per windowMs
    store: new RedisStore(),
    message: {
      status: 429,
      message: "Too many password reset attempts, please try again later.",
    },
  }),

};

// Dynamic rate limiter creator
export const createRateLimiter = (options: Partial<typeof defaultOptions> & { name?: string }) => {
  return rateLimit({
    ...defaultOptions,
    ...options,
    store: new RedisStore()
  });
};