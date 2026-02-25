import { CacheRecord, ILegalCache } from './types.js';

export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', ttlSeconds: number): Promise<unknown>;
}

export class RedisLegalCache implements ILegalCache {
  constructor(private readonly redis: RedisLike) {}

  async get<T>(key: string): Promise<CacheRecord<T> | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheRecord<T>;
  }

  async set<T>(key: string, record: CacheRecord<T>, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(record), 'EX', ttlSeconds);
  }
}
