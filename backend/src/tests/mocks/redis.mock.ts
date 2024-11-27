export const mockRedis = {
  cache: new Map<string, string>(),
  async get(key: string): Promise<string | null> {
    return this.cache.get(key) || null;
  },
  async setex(key: string, ttl: number, value: string): Promise<void> {
    this.cache.set(key, value);
    setTimeout(() => this.cache.delete(key), ttl * 1000);
  },
  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
};
