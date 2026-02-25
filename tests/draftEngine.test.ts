import {
  DraftEngine,
  DraftReply,
  buildInsufficientLegalBasisReply,
  isDraftReply,
  loadDraftReplySchema
} from '../packages/draft-engine/src';

describe('DraftEngine', () => {
  it('passes schema-required shape validation for structured output', async () => {
    const mockReply: DraftReply = {
      petition_summary: 'Summary',
      fact_analysis: 'Fact analysis',
      legal_review: 'Legal review with citations',
      decision: 'APPROVE',
      action_plan: 'Action plan',
      legal_basis: [
        {
          law_name: 'Administrative Act',
          article_number: 'Article 10',
          effective_date: '2024-01-01',
          source_link: 'https://example.com/law'
        }
      ],
      audit_risk: {
        level: 'LOW',
        findings: ['No material procedural issue'],
        recommendations: ['Proceed with documented approval']
      }
    };

    const engine = new DraftEngine({
      createStructuredOutput: jest.fn().mockResolvedValue(mockReply)
    } as any);

    const draft = await engine.generateDraft({
      petition_summary: 'Summary',
      legal_sources: mockReply.legal_basis
    });

    const schema = loadDraftReplySchema() as {
      required: string[];
      properties: Record<string, unknown>;
    };

    expect(isDraftReply(draft)).toBe(true);
    for (const key of schema.required) {
      expect(draft).toHaveProperty(key);
    }
    expect(schema.properties).toHaveProperty('audit_risk');
  });

  it('returns REQUEST_INFO when legal_sources is empty', async () => {
    const engine = new DraftEngine({
      createStructuredOutput: jest.fn()
    } as any);

    const reply = await engine.generateDraft({
      petition_summary: 'No citation input',
      legal_sources: []
    });

    expect(reply.decision).toBe('REQUEST_INFO');
    expect(reply.legal_review).toContain('Insufficient Legal Basis');

    const fallback = buildInsufficientLegalBasisReply('No citation input');
    expect(reply).toEqual(fallback);
  });
});
