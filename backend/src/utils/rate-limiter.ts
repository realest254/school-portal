import { redisClient } from '../config/redis';
import { RateLimitError } from '../types/invite.types';
import { logger } from './logger';

interface RateLimitConfig {
  key: string;
  limit: number;
  windowSecs: number;
}

export class RateLimiter {
  private static readonly IP_INVITE_LIMIT: RateLimitConfig = {
    key: 'rate:ip:invite:',
    limit: 10,
    windowSecs: 3600 // 1 hour
  };

  private static readonly EMAIL_INVITE_LIMIT: RateLimitConfig = {
    key: 'rate:email:invite:',
    limit: 3,
    windowSecs: 86400 // 24 hours
  };

  private static readonly BULK_INVITE_LIMIT: RateLimitConfig = {
    key: 'rate:bulk:invite:',
    limit: 2,
    windowSecs: 3600 // 1 hour
  };

  private static async checkLimit(identifier: string, config: RateLimitConfig): Promise<void> {
    const key = config.key + identifier;
    
    try {
      const withinLimit = await redisClient.checkRateLimit(key, config.limit, config.windowSecs);
      
      if (!withinLimit) {
        const count = await redisClient.getRateLimit(key);
        logger.warn(`Rate limit exceeded for ${identifier}. Count: ${count}/${config.limit}`);
        throw new RateLimitError(`Rate limit exceeded. Please try again later.`);
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      // If Redis fails, log the error but allow the request
      logger.error('Rate limiter error:', error);
    }
  }

  static async checkIpLimit(ip: string): Promise<void> {
    await this.checkLimit(ip, this.IP_INVITE_LIMIT);
  }

  static async checkEmailLimit(email: string): Promise<void> {
    await this.checkLimit(email, this.EMAIL_INVITE_LIMIT);
  }

  static async checkBulkInviteLimit(userId: string): Promise<void> {
    await this.checkLimit(userId, this.BULK_INVITE_LIMIT);
  }

  static async resetLimit(identifier: string, type: 'ip' | 'email' | 'bulk'): Promise<void> {
    try {
      const key = this.getKeyByType(type) + identifier;
      await redisClient.del(key);
    } catch (error) {
      logger.error('Error resetting rate limit:', error);
    }
  }

  private static getKeyByType(type: 'ip' | 'email' | 'bulk'): string {
    switch (type) {
      case 'ip':
        return this.IP_INVITE_LIMIT.key;
      case 'email':
        return this.EMAIL_INVITE_LIMIT.key;
      case 'bulk':
        return this.BULK_INVITE_LIMIT.key;
    }
  }
}
