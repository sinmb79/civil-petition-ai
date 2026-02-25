import test from 'node:test';
import assert from 'node:assert/strict';
import { AuditLogService } from '../packages/server/src/audit-log.js';
import { InMemoryAuditLogRepository, InMemoryPetitionRepository } from '../packages/server/src/repositories.js';
import { PetitionService } from '../packages/server/src/petition-service.js';

const tenantId = 'tenant-a';
const context = { requestId: 'req-1', ip: '127.0.0.1', userAgent: 'vitest' };

function makeService(config) {
  const petitionRepo = new InMemoryPetitionRepository();
  const auditRepo = new InMemoryAuditLogRepository();
  const audit = new AuditLogService(auditRepo);
  const service = new PetitionService(petitionRepo, audit, config);
  return { service, petitionRepo, auditRepo };
}

test('STORE_RAW_PETITION_TEXT=false일 때 원문 미저장', async () => {
  const { service, petitionRepo } = makeService({
    storeRawPetitionText: false,
    rawTextVisibleRoles: ['ADMIN']
  });

  const created = await service.createPetition({
    tenantId,
    rawText: '전화번호 01012345678',
    user: { userId: 'admin-1', role: 'ADMIN' },
    context
  });

  const saved = await petitionRepo.findById(created.id);
  assert.equal(saved?.raw_text, null);
  assert.equal(saved?.raw_text_masked.includes('01012345678'), false);
});

test('ADMIN/STAFF/VIEWER 텍스트 반환 정책', async () => {
  const { service } = makeService({
    storeRawPetitionText: true,
    rawTextVisibleRoles: ['ADMIN']
  });

  const created = await service.createPetition({
    tenantId,
    rawText: '이메일 staff@example.com',
    user: { userId: 'admin-1', role: 'ADMIN' },
    context
  });

  const adminView = await service.getPetition(created.id, tenantId, { userId: 'admin-2', role: 'ADMIN' }, context);
  assert.equal(adminView.masked, false);
  assert.ok(adminView.text.includes('staff@example.com'));

  const staffView = await service.getPetition(created.id, tenantId, { userId: 'staff-1', role: 'STAFF' }, context);
  assert.equal(staffView.masked, true);
  assert.equal(staffView.text.includes('staff@example.com'), false);

  const viewerView = await service.getPetition(created.id, tenantId, { userId: 'viewer-1', role: 'VIEWER' }, context);
  assert.equal(viewerView.masked, true);
});
