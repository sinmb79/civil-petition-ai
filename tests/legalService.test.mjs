import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryLegalCache } from '../packages/legal-engine/src/cache/memoryCache.js';
import { LegalService } from '../packages/legal-engine/src/legalService.js';
import { StructuredLogger } from '../packages/logger/src/index.js';
import { LawApiClient } from '../integrations/law-api/client.js';
import { loadConfig } from '../packages/core/config.js';

test('cache hit keeps upstream call count at zero', async () => {
  const cache = new MemoryLegalCache();
  await cache.set('law:search:도로', { value: [{ id: 'L1', title: '법', effective_date: '2024-01-01', url: 'u' }], fetchedAt: new Date().toISOString() }, 1000);

  const logger = new StructuredLogger(() => undefined);
  let called = 0;
  const client = new LawApiClient(
    loadConfig({ LAW_API_BASE_URL: 'https://example.test', LAW_API_KEY: 'k', LEGAL_CACHE_MODE: 'memory' }),
    logger,
    { fetchImpl: async () => { called += 1; throw new Error('should not call'); } },
  );

  const service = new LegalService(cache, client, logger);
  const result = await service.searchLaws('도로', 'req-1');

  assert.equal(result.length, 1);
  assert.equal(called, 0);
});
