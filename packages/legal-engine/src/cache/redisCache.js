export class RedisLegalCache {
  constructor(redis) {
    this.redis = redis;
  }

  async get(key) {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  }

  async set(key, record, ttlSeconds) {
    await this.redis.set(key, JSON.stringify(record), 'EX', ttlSeconds);
  }
}
