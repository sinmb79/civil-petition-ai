import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDraft } from '../api/petitions/generateDraft.js';
import { StructuredLogger } from '../packages/logger/src/index.js';
import { RateLimitError } from '../integrations/law-api/errors.js';

const logger = new StructuredLogger(() => undefined);

test('generateDraft returns 429 on rate limit', async () => {
  const service = {
    searchLaws: async () => { throw new RateLimitError(); },
  };

  const result = await generateDraft({ petitionId: 'p1', requestId: 'r1', query: '도로' }, service, logger);
  assert.equal(result.status, 429);
});
