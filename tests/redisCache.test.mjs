import test from 'node:test';
import assert from 'node:assert/strict';
import { RedisLegalCache } from '../packages/legal-engine/src/cache/redisCache.js';

class RedisMock {
  constructor() { this.store = new Map(); }
  async get(key) { return this.store.get(key) ?? null; }
  async set(key, value) { this.store.set(key, value); return 'OK'; }
}

test('redis cache adapter stores json payload', async () => {
  const cache = new RedisLegalCache(new RedisMock());
  await cache.set('k', { value: [{ id: 1 }], fetchedAt: new Date().toISOString() }, 30);
  const found = await cache.get('k');
  assert.equal(found.value[0].id, 1);
});
