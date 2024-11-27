export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class TestRateLimiter {
  private static rateLimits = new Map<string, number>();
  private static readonly TEST_IP_LIMIT = 5;
  private static readonly TEST_EMAIL_LIMIT = 3;

  static async checkIpLimit(ip: string): Promise<void> {
    if (ip.startsWith('test-ip-')) {
      return; // Skip limits for test IPs
    }
    
    const count = this.rateLimits.get(ip) || 0;
    if (count >= this.TEST_IP_LIMIT) {
      throw new RateLimitError(`IP rate limit exceeded (${count}/${this.TEST_IP_LIMIT})`);
    }
    this.rateLimits.set(ip, count + 1);
    setTimeout(() => this.rateLimits.delete(ip), 60 * 1000);
  }

  static async checkEmailLimit(email: string): Promise<void> {
    if (email.startsWith('test-')) {
      return; // Skip limits for test emails
    }
    
    const count = this.rateLimits.get(email) || 0;
    if (count >= this.TEST_EMAIL_LIMIT) {
      throw new RateLimitError(`Email rate limit exceeded (${count}/${this.TEST_EMAIL_LIMIT})`);
    }
    this.rateLimits.set(email, count + 1);
    setTimeout(() => this.rateLimits.delete(email), 3600 * 1000);
  }

  static resetLimits(): void {
    this.rateLimits.clear();
  }

  static getLimitCount(key: string): number {
    return this.rateLimits.get(key) || 0;
  }
}
