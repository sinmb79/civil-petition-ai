import { describe, expect, it } from 'vitest';
import { DraftEngine, type DraftRenderer } from './index';

describe('DraftEngine', () => {
  it('delegates rendering to injected renderer', async () => {
    const renderer: DraftRenderer = {
      async render() {
        return 'draft';
      }
    };

    const engine = new DraftEngine(renderer);
    await expect(
      engine.generateDraft({
        petition: { id: 'p-1', content: 'test' },
        legalBasis: [],
        auditRisk: { level: 'LOW', findings: [], recommendations: [] }
      })
    ).resolves.toBe('draft');
  });
});
