import test from 'node:test';
import assert from 'node:assert/strict';
import sampleCases from '../../../tests/fixtures/audit_cases.sample.json' with { type: 'json' };
import { AuditRiskEngine, matchAuditCases } from '../src/index.js';

const engine = new AuditRiskEngine();

const completeLegalSource = {
  title: 'Administrative Procedure Act',
  article: 'Article 4',
  effective_date: '2024-01-01',
  source_url: 'https://example.local/law/article4',
};

const baseInput = {
  petition: {
    id: 'P-001',
    raw_text: '일반 민원 요청입니다.',
    processing_type: 'permit',
    budget_related: false,
    discretionary: false,
  },
  decision: 'ACCEPT',
  legal_sources: [completeLegalSource],
  procedural_steps_completed: ['NOTICE'],
  budget_context: { available: true, purpose_match: true },
  audit_cases: [],
};

test('TC1: empty legal sources => HIGH with exact score', () => {
  const output = engine.evaluate({
    ...baseInput,
    legal_sources: [],
    petition: { ...baseInput.petition, discretionary: true },
    procedural_steps_completed: ['HEARING'],
  });

  assert.equal(output.score_breakdown.total, 70);
  assert.equal(output.level, 'HIGH');
  assert.equal(output.score_breakdown.by_rule.R1_MISSING_LEGAL_BASIS, 50);
  assert.ok(output.recommendations.length > 0);
});

test('TC2: incomplete citation => LOW with exact score', () => {
  const output = engine.evaluate({
    ...baseInput,
    legal_sources: [{ title: 'Local Ordinance', article: 'Art 9' }],
  });

  assert.equal(output.score_breakdown.total, 30);
  assert.equal(output.level, 'LOW');
  assert.equal(output.score_breakdown.by_rule.R2_INCOMPLETE_CITATION, 30);
});

test('TC3: discretionary + missing NOTICE => MODERATE', () => {
  const output = engine.evaluate({
    ...baseInput,
    petition: { ...baseInput.petition, discretionary: true },
    procedural_steps_completed: ['HEARING'],
    decision: 'REJECT',
    audit_cases: [sampleCases[0]],
  });

  assert.equal(output.score_breakdown.total, 35);
  assert.equal(output.level, 'MODERATE');
  assert.equal(output.score_breakdown.by_rule.R3_PROCEDURE_OMISSION, 20);
  assert.ok(output.recommendations.length > 0);
});

test('TC4: budget_related + purpose mismatch => HIGH', () => {
  const output = engine.evaluate({
    ...baseInput,
    petition: { ...baseInput.petition, budget_related: true },
    budget_context: { available: true, purpose_match: false },
    legal_sources: [],
  });

  assert.equal(output.score_breakdown.total, 90);
  assert.equal(output.level, 'HIGH');
  assert.equal(output.score_breakdown.by_rule.R1_MISSING_LEGAL_BASIS, 50);
  assert.equal(output.score_breakdown.by_rule.R4_BUDGET_MISUSE, 40);
  assert.ok(output.recommendations.length > 0);
});

test('TC5: preferential treatment token => MODERATE', () => {
  const output = engine.evaluate({
    ...baseInput,
    petition: { ...baseInput.petition, raw_text: '담당자 지인이라서 봐주기 요청이 있습니다.' },
    audit_cases: [sampleCases[2]],
  });

  assert.equal(output.score_breakdown.total, 40);
  assert.equal(output.level, 'MODERATE');
  assert.equal(output.score_breakdown.by_rule.R5_PREFERENTIAL_TREATMENT_SIGNAL, 25);
  assert.ok(output.recommendations.length > 0);
});

test('TC6: repeat audit pattern >=3 => MODERATE/HIGH by scoring', () => {
  const matchedCases = matchAuditCases('예산 목적 외 사용과 압력 신고 notice citation', ['budget', 'citation', 'notice'], sampleCases);
  const output = engine.evaluate({
    ...baseInput,
    audit_cases: matchedCases,
    petition: { ...baseInput.petition, budget_related: true, discretionary: true },
    procedural_steps_completed: [],
    budget_context: { purpose_match: true },
  });

  assert.ok(matchedCases.length >= 3);
  assert.equal(output.score_breakdown.total, 45);
  assert.equal(output.level, 'MODERATE');
  assert.equal(output.score_breakdown.by_rule.R6_REPEAT_AUDIT_PATTERN, 25);
  assert.equal(output.score_breakdown.by_rule.R3_PROCEDURE_OMISSION, 20);
  assert.ok(output.recommendations.length > 0);
});

test('deduplicates recommendations from multiple findings', () => {
  const output = engine.evaluate({
    ...baseInput,
    legal_sources: [],
    petition: { ...baseInput.petition, raw_text: '청탁 및 압력 의혹' },
    audit_cases: sampleCases,
  });

  assert.equal(output.score_breakdown.total, 100);
  assert.equal(output.level, 'HIGH');
  assert.equal(output.recommendations.length, new Set(output.recommendations).size);
});
