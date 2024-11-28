import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class CacheService {
  private redis: Redis;
  private readonly DEFAULT_TTL = 300; // 5 minutes in seconds

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
  }

  private generateKey(prefix: string, identifier: string): string {
    return `notification:${prefix}:${identifier}`;
  }

  async get<T>(prefix: string, identifier: string): Promise<T | null> {
    try {
      const key = this.generateKey(prefix, identifier);
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn('Cache get error:', error);
      return null;
    }
  }

  async set(prefix: string, identifier: string, data: any, ttl = this.DEFAULT_TTL): Promise<void> {
    try {
      const key = this.generateKey(prefix, identifier);
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.warn('Cache set error:', error);
    }
  }

  async invalidate(prefix: string, identifier: string): Promise<void> {
    try {
      const key = this.generateKey(prefix, identifier);
      await this.redis.del(key);
    } catch (error) {
      logger.warn('Cache invalidation error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`notification:${pattern}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.warn('Cache pattern invalidation error:', error);
    }
  }
}
