import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryVectorStore } from '../packages/core/in-memory-vector-store.js';
import { createApp } from '../src/app.js';
import { EmbeddingService } from '../src/embedding.js';
import { PetitionService } from '../src/petition-service.js';

async function seedPetitions(service) {
  await service.createPetition({ id: 'p1', raw_text_masked: '도로 보수 요청 및 보행 안전 민원', petition_summary: '도로 보수 요청' });
  await service.createPetition({ id: 'p2', raw_text_masked: '보도블럭 파손으로 보행자 안전 위험', petition_summary: '보도블럭 파손 신고' });
  await service.createPetition({ id: 'p3', raw_text_masked: '주차 단속 강화 요청', petition_summary: '주차 단속 민원' });
  await service.completeDraftReply({ id: 'd1', petition_id: 'p2', summary_text: '보행 안전 개선 계획 수립', decision: '부분수용' });
}

test('GET /api/petitions/:id/similar returns local vector recommendations', async () => {
  const service = new PetitionService('local', new InMemoryVectorStore(), new EmbeddingService('local'));
  await seedPetitions(service);
  const app = createApp(service);

  const response = await app.handleGet('/api/petitions/p1/similar?topK=2');
  assert.equal(response.status, 200);
  assert.equal(response.body.results.length, 2);
  assert.equal(response.body.results[0].petition_id, 'p2');
  assert.equal(response.body.results[0].decision, '부분수용');
});

test('VECTOR_MODE=off falls back to keyword recommendation', async () => {
  const service = new PetitionService('off', new InMemoryVectorStore(), new EmbeddingService('off'));
  await seedPetitions(service);
  const app = createApp(service);

  const response = await app.handleGet('/api/petitions/p1/similar?topK=1');
  assert.equal(response.status, 200);
  assert.equal(response.body.results.length, 1);
  assert.equal(response.body.results[0].petition_id, 'p2');
  assert.ok(response.body.results[0].score > 0);
});
