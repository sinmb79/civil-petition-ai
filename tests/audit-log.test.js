import test from 'node:test';
import assert from 'node:assert/strict';
import { AuditLogService } from '../packages/server/src/audit-log.js';
import { InMemoryAuditLogRepository, InMemoryPetitionRepository } from '../packages/server/src/repositories.js';
import { PetitionService } from '../packages/server/src/petition-service.js';

const context = { requestId: 'req-77', ip: '10.0.0.1', userAgent: 'unit-test-agent' };

test('주요 API 호출 시 AuditLog 생성', async () => {
  const petitionRepo = new InMemoryPetitionRepository();
  const auditRepo = new InMemoryAuditLogRepository();
  const audit = new AuditLogService(auditRepo);
  const service = new PetitionService(petitionRepo, audit, {
    storeRawPetitionText: true,
    rawTextVisibleRoles: ['ADMIN']
  });

  const petition = await service.createPetition({
    tenantId: 'tenant-a',
    rawText: '민원 내용',
    user: { userId: 'u-1', role: 'ADMIN' },
    context
  });

  await service.getPetition(petition.id, 'tenant-a', { userId: 'u-2', role: 'VIEWER' }, context);
  await service.updatePetition(petition.id, 'tenant-a', '수정 민원 내용', { userId: 'u-1', role: 'ADMIN' }, context);
  await service.requestDraftGeneration(petition.id, 'tenant-a', { userId: 'u-1', role: 'ADMIN' }, context);
  await service.registerAuditCorpusDoc('doc-1', 'tenant-a', { userId: 'u-1', role: 'ADMIN' }, context);
  await service.searchAuditCorpus('query-1', 'tenant-a', { userId: 'u-1', role: 'ADMIN' }, context);
  await service.deletePetition(petition.id, 'tenant-a', { userId: 'u-1', role: 'ADMIN' }, context);

  const logs = await auditRepo.list();
  const actions = logs.map((l) => l.action);
  for (const action of [
    'PETITION_CREATE',
    'PETITION_VIEW',
    'PETITION_UPDATE',
    'PETITION_DELETE',
    'DRAFT_GENERATE_REQUEST',
    'AUDIT_CORPUS_REGISTER',
    'AUDIT_CORPUS_SEARCH'
  ]) {
    assert.ok(actions.includes(action));
  }

  assert.deepEqual(logs[0].metadata, {
    request_id: 'req-77',
    ip: '10.0.0.1',
    user_agent: 'unit-test-agent'
  });
});
