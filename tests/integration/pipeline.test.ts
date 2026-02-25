import { describe, expect, it } from 'vitest';
import { LegalEngine } from '@civil/legal-engine';
import { AuditEngine } from '@civil/audit-engine';
import { DraftEngine } from '@civil/draft-engine';

describe('petition pipeline (integration skeleton)', () => {
  it('runs petition -> legal retrieval -> draft -> audit risk with mocks', async () => {
    const petition = { id: 'petition-1', content: 'Need decision support output.' };

    const legalEngine = new LegalEngine({
      async retrieveForPetition() {
        return [
          {
            lawName: 'Mock Law',
            articleNumber: 'Art.1',
            effectiveDate: '2024-01-01',
            sourceLink: 'https://example.com/law'
          }
        ];
      }
    });

    const auditEngine = new AuditEngine({
      async assess() {
        return { level: 'LOW', findings: [], recommendations: [] };
      }
    });

    const draftEngine = new DraftEngine({
      async render() {
        return 'Mock draft response';
      }
    });

    const legalBasis = await legalEngine.getLegalSources(petition);
    const auditRisk = await auditEngine.evaluate({ petition, legalBasis });
    const draft = await draftEngine.generateDraft({ petition, legalBasis, auditRisk });

    expect(legalBasis).toHaveLength(1);
    expect(auditRisk.level).toBe('LOW');
    expect(draft).toContain('Mock draft');
  });
});
