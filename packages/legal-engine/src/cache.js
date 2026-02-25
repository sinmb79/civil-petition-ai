import { ILegalCache } from './types.js';

export class InMemoryLegalCache extends ILegalCache {
  constructor() {
    super();
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key) ?? null;
  }

  async set(key, value) {
    this.store.set(key, value);
  }
}

export class RedisLegalCacheStub extends ILegalCache {
  async get(_key) {
    throw new Error('RedisLegalCacheStub is not implemented yet.');
  }

  async set(_key, _value) {
    throw new Error('RedisLegalCacheStub is not implemented yet.');
  }
}
