import test from 'node:test';
import assert from 'node:assert/strict';
import { EmbeddingService } from '../src/embedding.js';

test('EmbeddingService openai mode uses mocked client without network call', async () => {
  let called = 0;
  const mockClient = {
    async embed(input) {
      called += 1;
      return [input.length, 1, 0];
    },
  };
  const service = new EmbeddingService('openai', mockClient);
  const result = await service.embed('raw_text_masked sample');

  assert.equal(called, 1);
  assert.deepEqual(result, [22, 1, 0]);
});
