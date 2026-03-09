import { redisClient } from '../config/redis';
import { logger } from '../../utils/logger';

// Checks if the Redis client exists AND is currently connected.
// Every cache operation calls this first — if Redis is unavailable
// for any reason (not configured, connection lost, etc.), operations
// silently no-op rather than throwing.
const isAvailable = (): boolean => !!redisClient?.isOpen;

// Wraps a Redis operation in a try/catch, returning a fallback value
// on failure. This centralizes the error handling pattern that would
// otherwise be duplicated across every cache method.
// 'context' is used in the warning log to identify which operation failed.
const withCache = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string,
  meta?: Record<string, unknown>
): Promise<T> => {
  try {
    return await operation();
  } catch (err) {
    logger.warn(`Cache ${context} failed`, { ...meta, err });
    return fallback;
  }
};

// Safely parses a raw JSON string from Redis into a typed value.
// Returns null if the input is empty or malformed  never throws.
// The <T> generic lets callers specify what shape they expect back.
const safeParse = <T>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const cacheService = {

  // Retrieves and deserializes a JSON value from Redis by key.
  // Returns null if Redis is unavailable, key doesn't exist, or
  // the stored value is not valid JSON.
  async getJson<T>(key: string): Promise<T | null> {
    if (!isAvailable()) return null;

    return withCache(
      async () => safeParse<T>(await redisClient!.get(key)),
      null,
      'get',
      { key }
    );
  },

  // Serializes a value to JSON and stores it in Redis with a TTL.
  // ttlSec is in seconds — after that time Redis automatically deletes the key.
  // Silently no-ops if Redis is unavailable.
  async setJson<T>(key: string, value: T, ttlSec: number): Promise<void> {
    if (!isAvailable()) return;

    await withCache(
      () => redisClient!.set(key, JSON.stringify(value), { EX: ttlSec }),
      undefined,
      'set',
      { key, ttlSec }
    );
  },

  // Deletes a single key from Redis.
  // Silently no-ops if Redis is unavailable or key doesn't exist.
  async del(key: string): Promise<void> {
    if (!isAvailable()) return;

    await withCache(
      () => redisClient!.del(key),
      undefined,
      'del',
      { key }
    );
  },

  // Deletes all keys that start with the given prefix.
  // Uses Redis KEYS command to find matches, then DEL to remove them all.
  // Example: deleteByPrefix('tasks:userId123:') removes all cached task lists
  // for that user — useful when their tasks are modified.
  async deleteByPrefix(prefix: string): Promise<void> {
    if (!isAvailable()) return;

    await withCache(
      async () => {
        const keys = await redisClient!.keys(`${prefix}*`);
        if (keys.length > 0) await redisClient!.del(keys);
      },
      undefined,
      'prefix delete',
      { prefix }
    );
  },
};