import test from 'node:test';
import assert from 'node:assert/strict';
import { LawApiClient } from '../integrations/law-api/client.js';
import { loadConfig } from '../packages/core/config.js';
import { StructuredLogger } from '../packages/logger/src/index.js';
import { TimeoutError } from '../integrations/law-api/errors.js';

const baseConfig = loadConfig({
  LAW_API_BASE_URL: 'https://example.test',
  LAW_API_KEY: 'secret',
  LAW_API_TIMEOUT_MS: '10',
  LAW_API_RETRY_COUNT: '2',
  LAW_API_RATE_LIMIT_PER_MIN: '60',
  LEGAL_CACHE_MODE: 'memory',
});

test('retries on timeout and succeeds', async () => {
  const logger = new StructuredLogger(() => undefined);
  let callCount = 0;
  const fetchImpl = async () => {
    callCount += 1;
    if (callCount < 3) {
      const error = new Error('abort');
      error.name = 'AbortError';
      throw error;
    }
    return new Response(JSON.stringify({ laws: [{ id: 'L1', title: '법', effective_date: '2024-01-01', url: 'u' }] }), { status: 200 });
  };

  const client = new LawApiClient(baseConfig, logger, { fetchImpl });
  const result = await client.searchLaws('도로', 'req-1');

  assert.equal(result.length, 1);
  assert.equal(callCount, 3);
});

test('fails after timeout retries exhausted', async () => {
  const logger = new StructuredLogger(() => undefined);
  const fetchImpl = async () => {
    const error = new Error('abort');
    error.name = 'AbortError';
    throw error;
  };

  const client = new LawApiClient(baseConfig, logger, { fetchImpl });
  await assert.rejects(() => client.searchLaws('도로', 'req-1'), TimeoutError);
});
