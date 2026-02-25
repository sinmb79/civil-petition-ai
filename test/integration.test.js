import test from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../src/db.js';
import { createApi } from '../src/api.js';
import { Roles } from '../src/rbac.js';

function buildFixture() {
  const db = createDb();
  const api = createApi(db);

  const seoul = db.createTenant('Seoul', 'SEOUL');
  const busan = db.createTenant('Busan', 'BUSAN');

  const adminRole = db.createRole(Roles.ADMIN);
  const managerRole = db.createRole(Roles.MANAGER);
  const staffRole = db.createRole(Roles.STAFF);
  const viewerRole = db.createRole(Roles.VIEWER);

  const seoulAdmin = db.createUser('admin@seoul.go.kr', 'Seoul Admin', seoul.id);
  const seoulStaff = db.createUser('staff@seoul.go.kr', 'Seoul Staff', seoul.id);
  const seoulViewer = db.createUser('viewer@seoul.go.kr', 'Seoul Viewer', seoul.id);
  const seoulManager = db.createUser('manager@seoul.go.kr', 'Seoul Manager', seoul.id);
  const busanAdmin = db.createUser('admin@busan.go.kr', 'Busan Admin', busan.id);

  db.assignRole(seoulAdmin.id, adminRole.id);
  db.assignRole(seoulStaff.id, staffRole.id);
  db.assignRole(seoulViewer.id, viewerRole.id);
  db.assignRole(seoulManager.id, managerRole.id);
  db.assignRole(busanAdmin.id, adminRole.id);

  const seoulPetition = db.createPetition({ tenantId: seoul.id }, 'A', 'A');
  const busanPetition = db.createPetition({ tenantId: busan.id }, 'B', 'B');

  return {
    api,
    ids: { seoulPetitionId: seoulPetition.id, busanPetitionId: busanPetition.id },
    headers: {
      seoulAdmin: { 'X-USER-EMAIL': seoulAdmin.email, 'X-TENANT-CODE': seoul.code },
      seoulStaff: { 'X-USER-EMAIL': seoulStaff.email, 'X-TENANT-CODE': seoul.code },
      seoulViewer: { 'X-USER-EMAIL': seoulViewer.email, 'X-TENANT-CODE': seoul.code },
      seoulManager: { 'X-USER-EMAIL': seoulManager.email, 'X-TENANT-CODE': seoul.code },
      busanAdmin: { 'X-USER-EMAIL': busanAdmin.email, 'X-TENANT-CODE': busan.code },
    },
  };
}

test('tenant 분리: 타 tenant petition 접근 불가', () => {
  const fx = buildFixture();
  const res = fx.api.getPetition(fx.headers.seoulAdmin, fx.ids.busanPetitionId);
  assert.equal(res.status, 404);
});

test('RBAC: VIEWER는 POST/DELETE 금지', () => {
  const fx = buildFixture();
  const postRes = fx.api.postPetition(fx.headers.seoulViewer, { title: 'x', content: 'y' });
  assert.equal(postRes.status, 403);

  const deleteRes = fx.api.deletePetition(fx.headers.seoulViewer, fx.ids.seoulPetitionId);
  assert.equal(deleteRes.status, 403);
});

test('RBAC: STAFF는 감사코퍼스 등록 금지', () => {
  const fx = buildFixture();
  const res = fx.api.postAuditCorpus(fx.headers.seoulStaff, { title: 'doc', body: 'body' });
  assert.equal(res.status, 403);
});

test('RBAC: ADMIN은 전체 가능', () => {
  const fx = buildFixture();

  const corpusRes = fx.api.postAuditCorpus(fx.headers.seoulAdmin, { title: 'doc', body: 'body' });
  assert.equal(corpusRes.status, 201);

  const deleteRes = fx.api.deletePetition(fx.headers.seoulAdmin, fx.ids.seoulPetitionId);
  assert.equal(deleteRes.status, 204);

  const managerCorpus = fx.api.postAuditCorpus(fx.headers.seoulManager, { title: 'doc2', body: 'body2' });
  assert.equal(managerCorpus.status, 201);
});
