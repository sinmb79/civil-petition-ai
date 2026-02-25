import { describe, expect, it } from 'vitest';
import sampleCases from '../../../tests/fixtures/audit_cases.sample.json';
import type { AuditRiskInput, LegalSource } from '../src';
import { AuditRiskEngine, matchAuditCases } from '../src';

const engine = new AuditRiskEngine();

const completeLegalSource: LegalSource = {
  title: 'Administrative Procedure Act',
  article: 'Article 4',
  effective_date: '2024-01-01',
  source_url: 'https://example.local/law/article4',
};

const baseInput: AuditRiskInput = {
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

describe('AuditRiskEngine integration flow', () => {
  it('TC1: empty legal sources => HIGH with exact score', () => {
    const output = engine.evaluate({
      ...baseInput,
      legal_sources: [],
      petition: { ...baseInput.petition, discretionary: true },
      procedural_steps_completed: ['HEARING'],
    });

    expect(output.score_breakdown.total).toBe(70);
    expect(output.level).toBe('HIGH');
    expect(output.score_breakdown.by_rule).toHaveProperty('R1_MISSING_LEGAL_BASIS', 50);
    expect(output.recommendations.length).toBeGreaterThan(0);
  });

  it('TC2: incomplete citation => MODERATE with exact score', () => {
    const output = engine.evaluate({
      ...baseInput,
      legal_sources: [{ title: 'Local Ordinance', article: 'Art 9' }],
    });

    expect(output.score_breakdown.total).toBe(30);
    expect(output.level).toBe('LOW');
    expect(output.score_breakdown.by_rule).toHaveProperty('R2_INCOMPLETE_CITATION', 30);
    expect(output.recommendations.length).toBeGreaterThan(0);
  });

  it('TC3: discretionary + missing NOTICE => MODERATE', () => {
    const output = engine.evaluate({
      ...baseInput,
      petition: { ...baseInput.petition, discretionary: true },
      procedural_steps_completed: ['HEARING'],
      decision: 'REJECT',
      audit_cases: [sampleCases[0]],
    });

    expect(output.score_breakdown.total).toBe(35);
    expect(output.level).toBe('MODERATE');
    expect(output.score_breakdown.by_rule).toHaveProperty('R3_PROCEDURE_OMISSION', 20);
    expect(output.recommendations.length).toBeGreaterThan(0);
  });

  it('TC4: budget_related + purpose mismatch => HIGH', () => {
    const output = engine.evaluate({
      ...baseInput,
      petition: { ...baseInput.petition, budget_related: true },
      budget_context: { available: true, purpose_match: false },
      legal_sources: [],
    });

    expect(output.score_breakdown.total).toBe(90);
    expect(output.level).toBe('HIGH');
    expect(output.score_breakdown.by_rule).toHaveProperty('R1_MISSING_LEGAL_BASIS', 50);
    expect(output.score_breakdown.by_rule).toHaveProperty('R4_BUDGET_MISUSE', 40);
    expect(output.recommendations.length).toBeGreaterThan(0);
  });

  it('TC5: preferential treatment token => MODERATE', () => {
    const output = engine.evaluate({
      ...baseInput,
      petition: { ...baseInput.petition, raw_text: '담당자 지인이라서 봐주기 요청이 있습니다.' },
      audit_cases: [sampleCases[2]],
    });

    expect(output.score_breakdown.total).toBe(40);
    expect(output.level).toBe('MODERATE');
    expect(output.score_breakdown.by_rule).toHaveProperty('R5_PREFERENTIAL_TREATMENT_SIGNAL', 25);
    expect(output.recommendations.length).toBeGreaterThan(0);
  });

  it('TC6: repeat audit pattern >=3 => MODERATE/HIGH by scoring', () => {
    const matchedCases = matchAuditCases('예산 목적 외 사용과 압력 신고', ['budget'], sampleCases);
    const output = engine.evaluate({
      ...baseInput,
      audit_cases: matchedCases,
      petition: { ...baseInput.petition, budget_related: true, discretionary: true },
      procedural_steps_completed: [],
      budget_context: { purpose_match: true },
    });

    expect(matchedCases.length).toBeGreaterThanOrEqual(3);
    expect(output.score_breakdown.total).toBe(45);
    expect(output.level).toBe('MODERATE');
    expect(output.score_breakdown.by_rule).toHaveProperty('R6_REPEAT_AUDIT_PATTERN', 25);
    expect(output.score_breakdown.by_rule).toHaveProperty('R3_PROCEDURE_OMISSION', 20);
    expect(output.recommendations.length).toBeGreaterThan(0);
  });

  it('deduplicates recommendations from multiple findings', () => {
    const output = engine.evaluate({
      ...baseInput,
      legal_sources: [],
      petition: { ...baseInput.petition, raw_text: '청탁 및 압력 의혹' },
      audit_cases: sampleCases,
    });

    expect(output.score_breakdown.total).toBe(100);
    expect(output.level).toBe('HIGH');
    expect(output.recommendations.length).toBe(new Set(output.recommendations).size);
  });
});
