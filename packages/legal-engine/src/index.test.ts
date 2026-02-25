import { describe, expect, it } from 'vitest';
import { LegalEngine, type LegalRetriever } from './index';

describe('LegalEngine', () => {
  it('delegates retrieval to injected retriever', async () => {
    const retriever: LegalRetriever = {
      async retrieveForPetition() {
        return [];
      }
    };

    const engine = new LegalEngine(retriever);
    await expect(engine.getLegalSources({ id: 'p-1', content: 'test' })).resolves.toEqual([]);
  });
});
