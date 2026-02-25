import { DraftReply, LegalSource } from '../packages/draft-engine/src';
import {
  applyValidationWithRepair,
  validatorPipeline
} from '../packages/core/validators';

function createBaseLegalSource(): LegalSource {
  return {
    law_name: 'Administrative Procedure Act',
    article_number: 'Article 10',
    effective_date: '2024-01-01',
    source_link: 'https://example.com/apa-10'
  };
}

function createBaseDraftReply(): DraftReply {
  const legalSource = createBaseLegalSource();
  return {
    petition_summary: '민원 요약',
    fact_analysis: '사실관계를 검토했습니다.',
    legal_review: '관련 법령 검토 결과입니다.',
    decision: 'APPROVE',
    action_plan: '절차에 따라 진행합니다.',
    legal_basis: [legalSource],
    audit_risk: {
      level: 'LOW',
      findings: ['특이사항 없음'],
      recommendations: ['기록 유지']
    }
  };
}

describe('validatorPipeline', () => {
  it('fails when output cites legal basis not included in input allowlist', () => {
    const output = createBaseDraftReply();
    const inputLegalSources = [
      {
        ...createBaseLegalSource(),
        article_number: 'Article 11'
      }
    ];

    const result = validatorPipeline(output, inputLegalSources);
    expect(result.status).toBe('FAIL');
    expect(result.issues.some((issue) => issue.validator === 'citationAllowlistValidator')).toBe(true);
  });

  it('fails when output includes PII', () => {
    const output = createBaseDraftReply();
    output.legal_review = '연락처는 010-1234-5678, 이메일은 user@example.com 입니다.';

    const result = validatorPipeline(output, [createBaseLegalSource()]);
    expect(result.status).toBe('FAIL');
    expect(result.issues.some((issue) => issue.validator === 'piiValidator')).toBe(true);
  });

  it('fails when REQUEST_INFO conflicts with acceptance phrase', () => {
    const output = createBaseDraftReply();
    output.decision = 'REQUEST_INFO';
    output.action_plan = '요청 내용을 수용합니다.';

    const result = validatorPipeline(output, [createBaseLegalSource()]);
    expect(result.status).toBe('FAIL');
    expect(result.issues.some((issue) => issue.validator === 'consistencyValidator')).toBe(true);
  });

  it('passes after repair for PII and certainty-expression violations', () => {
    const output = createBaseDraftReply();
    output.decision = 'REQUEST_INFO';
    output.legal_review = '담당자 이메일은 user@example.com 입니다.';
    output.action_plan = '요청 내용을 수용합니다.';

    const repaired = applyValidationWithRepair(output, [createBaseLegalSource()], '민원 요약');

    expect(repaired.fellBack).toBe(false);
    expect(repaired.output.decision).toBe('REQUEST_INFO');
    expect(repaired.output.legal_review).not.toContain('user@example.com');
    expect(repaired.output.action_plan).not.toContain('수용합니다');
    expect(repaired.validation.status).toBe('PASS');
  });
});
