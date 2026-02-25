import { DraftReply, Petition } from './types';

export function generateDraftFromPetition(petition: Petition): DraftReply {
  const riskScore = {
    procedural_omission: petition.processing_type === 'expedited' ? 25 : 10,
    abuse_of_discretion: petition.discretionary ? 25 : 10,
    budget_misuse: petition.budget_related ? 20 : 5,
    legal_basis: 15,
    preferential_treatment: petition.discretionary ? 10 : 5,
    repeated_findings: 5
  };

  const total = Object.values(riskScore).reduce((sum, value) => sum + value, 0);
  const level = total >= 80 ? 'HIGH' : total >= 45 ? 'MODERATE' : 'LOW';

  return {
    petition_id: petition.id,
    petition_summary: petition.raw_text.slice(0, 200),
    fact_analysis: `Processing type is ${petition.processing_type}. Budget related: ${petition.budget_related ? 'yes' : 'no'}. Discretionary decision: ${petition.discretionary ? 'yes' : 'no'}.`,
    legal_review:
      'Review applicable statutes and ordinances before final disposition. If retrieved evidence is incomplete, mark as Insufficient Legal Basis.',
    decision:
      level === 'HIGH'
        ? 'Pending additional legal and procedural review.'
        : 'Proceed with standard administrative handling.',
    action_plan:
      'Collect supporting evidence, verify citations, and route draft for legal/audit review.',
    legal_basis: [
      {
        law_name: 'Administrative Procedures Act',
        article_number: 'Article 17',
        effective_date: '2024-01-01',
        source_link: 'https://www.law.go.kr/'
      }
    ],
    audit_risk: {
      level,
      score_breakdown: riskScore,
      findings: [
        petition.discretionary
          ? 'Discretionary factors detected; consistency control required.'
          : 'No significant discretionary overreach signal detected.'
      ],
      recommendations: [
        'Confirm legal basis citations are complete (law name/article/effective date/source link).',
        'Attach budget justification when budget-related impact is present.'
      ]
    },
    created_at: new Date().toISOString()
  };
}
