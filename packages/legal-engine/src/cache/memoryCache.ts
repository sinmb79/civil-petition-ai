import { CacheRecord, ILegalCache } from './types.js';

type StoreValue = {
  expiresAt: number;
  payload: CacheRecord<unknown>;
};

export class MemoryLegalCache implements ILegalCache {
  private readonly store = new Map<string, StoreValue>();

  async get<T>(key: string): Promise<CacheRecord<T> | null> {
    const found = this.store.get(key);
    if (!found) return null;
    if (Date.now() > found.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return found.payload as CacheRecord<T>;
  }

  async set<T>(key: string, record: CacheRecord<T>, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      expiresAt: Date.now() + ttlSeconds * 1000,
      payload: record,
    });
  }
}
