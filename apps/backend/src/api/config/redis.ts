import { createClient } from 'redis';
import { logger } from '../../utils/logger';

const REDIS_URL = process.env.REDIS_URL;

export const redisClient = REDIS_URL
  ? createClient({ url: REDIS_URL })
  : null;

// Must attach before connecting — unhandled Redis errors crash the process.
if (redisClient) {
  redisClient.on('error', (err) => logger.warn('Redis Error', { err }));
}

export const connectRedis = async (): Promise<void> => {
  if (!redisClient) {
    logger.warn('REDIS_URL not configured. Redis caching disabled.');
    return;
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  }
};
