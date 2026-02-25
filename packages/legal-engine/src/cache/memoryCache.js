export class MemoryLegalCache {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const found = this.store.get(key);
    if (!found) return null;
    if (Date.now() > found.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return found.payload;
  }

  async set(key, record, ttlSeconds) {
    this.store.set(key, {
      expiresAt: Date.now() + ttlSeconds * 1000,
      payload: record,
    });
  }
}
