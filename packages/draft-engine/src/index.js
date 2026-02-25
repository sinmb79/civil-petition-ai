import { AUDIT_RISK_LEVELS, DRAFT_DECISIONS } from '../../shared/src/types.js';

export const draftReplySchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'petition_summary',
    'fact_analysis',
    'legal_review',
    'decision',
    'action_plan',
    'legal_basis',
    'audit_risk'
  ],
  properties: {
    petition_summary: { type: 'string' },
    fact_analysis: { type: 'string' },
    legal_review: { type: 'string' },
    decision: { enum: DRAFT_DECISIONS },
    action_plan: { type: 'string' },
    legal_basis: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'article', 'effective_date', 'source_url'],
        properties: {
          title: { type: 'string' },
          article: { type: 'string' },
          effective_date: { type: 'string' },
          source_url: { type: 'string' }
        }
      }
    },
    audit_risk: {
      type: 'object',
      additionalProperties: false,
      required: ['level', 'findings', 'recommendations'],
      properties: {
        level: { enum: AUDIT_RISK_LEVELS },
        findings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  }
};

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

export const validateDraftReplySchema = (draft) => {
  if (!isObject(draft)) {
    return false;
  }

  const requiredKeys = new Set(draftReplySchema.required);
  const draftKeys = Object.keys(draft);

  if (draftKeys.some((key) => !requiredKeys.has(key))) {
    return false;
  }

  if ([...requiredKeys].some((key) => !(key in draft))) {
    return false;
  }

  if (
    typeof draft.petition_summary !== 'string' ||
    typeof draft.fact_analysis !== 'string' ||
    typeof draft.legal_review !== 'string' ||
    typeof draft.action_plan !== 'string'
  ) {
    return false;
  }

  if (typeof draft.decision !== 'string' || !DRAFT_DECISIONS.includes(draft.decision)) {
    return false;
  }

  if (!Array.isArray(draft.legal_basis)) {
    return false;
  }

  const legalBasisValid = draft.legal_basis.every((citation) => {
    if (!isObject(citation)) {
      return false;
    }
    const keys = Object.keys(citation);
    const requiredCitationKeys = ['title', 'article', 'effective_date', 'source_url'];

    if (keys.some((key) => !requiredCitationKeys.includes(key))) {
      return false;
    }

    return requiredCitationKeys.every(
      (key) => typeof citation[key] === 'string' && citation[key].trim().length > 0
    );
  });

  if (!legalBasisValid || !isObject(draft.audit_risk)) {
    return false;
  }

  const auditRisk = draft.audit_risk;
  const auditRiskKeys = ['level', 'findings', 'recommendations'];
  if (Object.keys(auditRisk).some((key) => !auditRiskKeys.includes(key))) {
    return false;
  }

  if (!AUDIT_RISK_LEVELS.includes(auditRisk.level)) {
    return false;
  }

  if (!Array.isArray(auditRisk.findings) || !auditRisk.findings.every((item) => typeof item === 'string')) {
    return false;
  }

  if (
    !Array.isArray(auditRisk.recommendations) ||
    !auditRisk.recommendations.every((item) => typeof item === 'string')
  ) {
    return false;
  }

  return true;
};

export class DraftEngine {
  generateDraft(input) {
    const legal_basis = input.legalSources.map((source) => ({
      title: source.title ?? 'Unknown source',
      article: source.article ?? source.reference_number ?? 'N/A',
      effective_date: source.effective_date ?? 'N/A',
      source_url: source.source_url ?? 'N/A'
    }));

    const draft = {
      petition_summary: `Petition ${input.petition.id}: ${input.petition.title}`,
      fact_analysis: `Content length ${input.petition.content.length} characters reviewed.`,
      legal_review: `Reviewed ${input.legalSources.length} legal source(s).`,
      decision: 'REQUEST_INFO',
      action_plan: 'Collect supplementary evidence and prepare follow-up review.',
      legal_basis,
      audit_risk: input.auditRisk
    };

    if (!validateDraftReplySchema(draft)) {
      throw new Error('Generated draft does not match strict DraftReply schema.');
    }

    return draft;
  }
}
