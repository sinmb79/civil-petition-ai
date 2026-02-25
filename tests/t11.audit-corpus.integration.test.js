import test from 'node:test';
import assert from 'node:assert/strict';

import { postAuditCorpusDocument, getAuditCorpusSearch } from '../src/api/auditCorpusApi.js';
import { resetStore } from '../src/dataStore.js';
import { AuditCorpusProvider } from '../src/integrations/audit-corpus/provider.js';
import { evaluateAuditRisk } from '../src/audit-engine/index.js';

test('문서 등록 -> 검색 -> audit-engine 공급 -> R6_REPEAT_AUDIT_PATTERN 트리거', async () => {
  resetStore();

  const createResponse = postAuditCorpusDocument({
    title: '예산집행 감사결과',
    source_org: '경기도 감사관',
    published_date: '2024-06-30',
    raw_text:
      '보조금 교부 절차를 누락하고 집행하여 반복 지적됨.\n\n동일 부서에서 같은 유형이 재지적됨.',
    tags: ['budget', 'repeat']
  });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.created_cases, 2);

  const searchResponse = getAuditCorpusSearch({ q: '보조금 교부', limit: 5 });
  assert.equal(searchResponse.status, 200);
  assert.ok(searchResponse.body.length >= 1);
  assert.equal(searchResponse.body[0].source.source_org, '경기도 감사관');

  const provider = new AuditCorpusProvider();
  const risk = await evaluateAuditRisk(provider, '보조금 교부');

  assert.equal(risk.level, 'HIGH');
  assert.ok(risk.findings.includes('R6_REPEAT_AUDIT_PATTERN'));
  assert.ok(risk.matchedCases.length >= 1);
});
