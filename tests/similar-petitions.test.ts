import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { InMemoryVectorStore } from '../packages/core/in-memory-vector-store.js';
import { createApp } from '../src/app.js';
import { EmbeddingService } from '../src/embedding.js';
import { PetitionService } from '../src/petition-service.js';

async function seedPetitions(service: PetitionService) {
  await service.createPetition({
    id: 'p1',
    raw_text_masked: '도로 보수 요청 및 보행 안전 민원',
    petition_summary: '도로 보수 요청',
  });
  await service.createPetition({
    id: 'p2',
    raw_text_masked: '보도블럭 파손으로 보행자 안전 위험',
    petition_summary: '보도블럭 파손 신고',
  });
  await service.createPetition({
    id: 'p3',
    raw_text_masked: '주차 단속 강화 요청',
    petition_summary: '주차 단속 민원',
  });

  await service.completeDraftReply({
    id: 'd1',
    petition_id: 'p2',
    summary_text: '보행 안전 개선 계획 수립',
    decision: '부분수용',
  });
}

describe('GET /api/petitions/:id/similar', () => {
  it('returns similar petitions when VECTOR_MODE=local', async () => {
    const vectorStore = new InMemoryVectorStore();
    const embedding = new EmbeddingService('local');
    const service = new PetitionService('local', vectorStore, embedding);
    await seedPetitions(service);

    const app = createApp(service);
    const response = await request(app).get('/api/petitions/p1/similar?topK=2');

    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(2);
    expect(response.body.results[0].petition_id).toBe('p2');
    expect(response.body.results[0].decision).toBe('부분수용');
  });

  it('falls back to keyword recommendation when VECTOR_MODE=off', async () => {
    const vectorStore = new InMemoryVectorStore();
    const embedding = new EmbeddingService('off');
    const service = new PetitionService('off', vectorStore, embedding);
    await seedPetitions(service);

    const app = createApp(service);
    const response = await request(app).get('/api/petitions/p1/similar?topK=1');

    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0].petition_id).toBe('p2');
    expect(response.body.results[0].score).toBeGreaterThan(0);
  });
});
