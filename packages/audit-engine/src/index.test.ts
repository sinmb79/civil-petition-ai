import { describe, expect, it } from 'vitest';
import { AuditEngine, type AuditAssessor } from './index';

describe('AuditEngine', () => {
  it('delegates risk evaluation to injected assessor', async () => {
    const assessor: AuditAssessor = {
      async assess() {
        return { level: 'MODERATE', findings: [], recommendations: [] };
      }
    };

    const engine = new AuditEngine(assessor);
    await expect(engine.evaluate({ petition: { id: 'p-1', content: 'test' }, legalBasis: [] })).resolves.toEqual({
      level: 'MODERATE',
      findings: [],
      recommendations: []
    });
  });
});
