import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryVectorStore } from '../packages/core/in-memory-vector-store.js';
import { EmbeddingService } from '../src/embedding.js';
import { evaluateR6RepeatedFinding, indexAuditCases, matchAuditCases } from '../src/audit-matcher.js';

const auditCases = [
  { id: 'a1', title: '절차 누락 지적', description: '안전 점검 절차를 생략하여 감사 지적 발생', findingType: 'procedural_omission' },
  { id: 'a2', title: '예산 목적 외 사용', description: '도로 보수 예산을 행사성 경비로 집행', findingType: 'budget_misuse' },
  { id: 'a3', title: '특혜성 처리 우려', description: '특정 민원인에게만 반복적인 행정 편의 제공', findingType: 'preferential_treatment' },
];

test('matchAuditCases uses keyword matching when vector mode is off', async () => {
  const matches = await matchAuditCases('예산 집행 목적 외 사용 우려', auditCases, 'off', new EmbeddingService('off'), new InMemoryVectorStore(), { topK: 2 });
  assert.equal(matches.length, 2);
  assert.equal(matches[0].auditCase.id, 'a2');
  assert.equal(matches[0].vectorScore, 0);
});

test('matchAuditCases supports vector candidates and R6 threshold rule', async () => {
  const store = new InMemoryVectorStore();
  const embedding = new EmbeddingService('local');
  await indexAuditCases(auditCases, 'local', embedding, store);

  const matches = await matchAuditCases('안전 점검 절차 누락 및 반복 지적', auditCases, 'local', embedding, store, { topK: 3, similarityThreshold: 0.1 });
  assert.ok(matches.length > 0);
  assert.ok(matches.some((m) => m.vectorScore > 0));
  assert.equal(evaluateR6RepeatedFinding(matches, 0.2), true);
});
