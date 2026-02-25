import type { DraftReplyOutput, LegalSource } from '../types.js';

export class DraftEngine {
  generateDraft(input: { petitionText: string; sources: LegalSource[] }): Omit<DraftReplyOutput, 'audit_risk'> {
    const legalBasis = input.sources.map((source) => ({
      lawName: source.title,
      articleNumber: source.article,
      effectiveDate: source.effectiveDate,
      sourceReferenceLink: source.sourceUrl,
    }));

    return {
      petition_summary: input.petitionText.slice(0, 120),
      fact_analysis: `Petition analyzed with ${input.sources.length} legal sources.`,
      legal_review: input.sources.length === 0 ? 'Insufficient Legal Basis.' : 'Relevant legal grounds identified.',
      decision: input.sources.length === 0 ? 'REQUEST_INFO' : 'PARTIAL',
      action_plan: input.sources.length === 0 ? 'Request additional legal documents.' : 'Proceed with conditional administrative action.',
      legal_basis: legalBasis,
    };
  }
}
