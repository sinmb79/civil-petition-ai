import { describe, expect, it } from 'vitest';
import { InMemoryVectorStore } from '../packages/core/in-memory-vector-store.js';
import { matchAuditCases, indexAuditCases, evaluateR6RepeatedFinding } from '../src/audit-matcher.js';
import { EmbeddingService } from '../src/embedding.js';
import { AuditCase } from '../src/models.js';

const auditCases: AuditCase[] = [
  {
    id: 'a1',
    title: '절차 누락 지적',
    description: '안전 점검 절차를 생략하여 감사 지적 발생',
    findingType: 'procedural_omission',
  },
  {
    id: 'a2',
    title: '예산 목적 외 사용',
    description: '도로 보수 예산을 행사성 경비로 집행',
    findingType: 'budget_misuse',
  },
  {
    id: 'a3',
    title: '특혜성 처리 우려',
    description: '특정 민원인에게만 반복적인 행정 편의 제공',
    findingType: 'preferential_treatment',
  },
];

describe('matchAuditCases', () => {
  it('uses keyword-only matching when VECTOR_MODE=off', async () => {
    const store = new InMemoryVectorStore();
    const embedding = new EmbeddingService('off');

    const matches = await matchAuditCases('예산 집행 목적 외 사용 우려', auditCases, 'off', embedding, store, { topK: 2 });

    expect(matches).toHaveLength(2);
    expect(matches[0].auditCase.id).toBe('a2');
    expect(matches[0].vectorScore).toBe(0);
  });

  it('supports vector-assisted matching and R6 repeat rule threshold', async () => {
    const store = new InMemoryVectorStore();
    const embedding = new EmbeddingService('local');
    await indexAuditCases(auditCases, 'local', embedding, store);

    const matches = await matchAuditCases('안전 점검 절차 누락 및 반복 지적', auditCases, 'local', embedding, store, {
      topK: 3,
      similarityThreshold: 0.1,
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((match) => match.vectorScore > 0)).toBe(true);
    expect(evaluateR6RepeatedFinding(matches, 0.2)).toBe(true);
  });
});
