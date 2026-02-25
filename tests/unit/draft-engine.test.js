import test from 'node:test';
import assert from 'node:assert/strict';

import { DraftEngine, validateDraftReplySchema } from '../../packages/draft-engine/src/index.js';

test('DraftEngine returns deterministic schema-valid draft', () => {
  const petition = {
    id: 'P-100',
    title: 'Road repair request',
    content: 'Please fix damaged road near the school.',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  };

  const auditRisk = {
    level: 'LOW',
    findings: [],
    recommendations: []
  };

  const draft = new DraftEngine().generateDraft({
    petition,
    auditRisk,
    legalSources: [
      {
        type: 'STATUTE',
        title: 'Civil Petitions Act',
        article: 'Article 5',
        effective_date: '2024-01-01',
        source_url: 'https://law.example/statute/5'
      }
    ]
  });

  assert.equal(draft.decision, 'REQUEST_INFO');
  assert.equal(validateDraftReplySchema(draft), true);
});

test('validateDraftReplySchema rejects invalid decision values', () => {
  const invalid = {
    petition_summary: 'summary',
    fact_analysis: 'facts',
    legal_review: 'review',
    decision: 'INVALID',
    action_plan: 'actions',
    legal_basis: [],
    audit_risk: {
      level: 'LOW',
      findings: [],
      recommendations: []
    }
  };

  assert.equal(validateDraftReplySchema(invalid), false);
});
