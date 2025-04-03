import { createClient } from '@redis/client';
import { LoggerService } from '../services/logger.service';

const logger = LoggerService.getInstance();
const redisClient = createClient({
  url: process.env.REDIS_URL
});

async function cleanupRateLimits() {
  try {
    await redisClient.connect();
    
    // Get all rate limit keys
    const keys = await redisClient.keys('rl:*');
    
    // Get current timestamp
    const now = Date.now();
    
    for (const key of keys) {
      const ttl = await redisClient.ttl(key);
      if (ttl <= 0) {
        await redisClient.del(key);
        logger.info(`Cleaned up rate limit key: ${key}`);
      }
    }
    
    logger.info('Rate limit cleanup completed');
  } catch (error) {
    logger.error('Rate limit cleanup error', error);
  } finally {
    await redisClient.quit();
  }
}

// Run cleanup
cleanupRateLimits();

