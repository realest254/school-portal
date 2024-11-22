import Redis from 'ioredis';
import { logger } from '../utils/logger';

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
};

class RedisClient {
  private static instance: RedisClient;
  private client: Redis;

  private constructor() {
    this.client = new Redis(REDIS_CONFIG);

    this.client.on('error', (error) => {
      logger.error('Redis Client Error:', error);
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient(): Redis {
    return this.client;
  }

  // Rate limiting methods
  async checkRateLimit(key: string, limit: number, windowSecs: number): Promise<boolean> {
    const current = await this.client.incr(key);
    if (current === 1) {
      await this.client.expire(key, windowSecs);
    }
    return current <= limit;
  }

  async getRateLimit(key: string): Promise<number> {
    const count = await this.client.get(key);
    return count ? parseInt(count) : 0;
  }

  // Cache methods
  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    return JSON.parse(data);
  }

  async set(key: string, value: any, expireSeconds?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (expireSeconds) {
      await this.client.setex(key, expireSeconds, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}

export const redisClient = RedisClient.getInstance();
export const redis = redisClient.getClient();
