import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RoleName } from '@prisma/client';
import { prisma } from '../src/prisma.js';
import { createApp } from '../src/app.js';

const app = createApp();

type SeedCtx = {
  seoul: { code: string; adminEmail: string; staffEmail: string; viewerEmail: string; petitionId: string };
  busan: { code: string; adminEmail: string; petitionId: string };
};

let ctx: SeedCtx;

async function seed(): Promise<SeedCtx> {
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.auditCase.deleteMany();
  await prisma.auditCorpusDocument.deleteMany();
  await prisma.auditFinding.deleteMany();
  await prisma.draftReply.deleteMany();
  await prisma.petition.deleteMany();
  await prisma.tenant.deleteMany();

  const [seoul, busan] = await Promise.all([
    prisma.tenant.create({ data: { name: 'Seoul', code: 'SEOUL' } }),
    prisma.tenant.create({ data: { name: 'Busan', code: 'BUSAN' } }),
  ]);

  const roles = await Promise.all(
    [RoleName.ADMIN, RoleName.MANAGER, RoleName.STAFF, RoleName.VIEWER].map((name) => prisma.role.create({ data: { name } })),
  );
  const roleByName = new Map(roles.map((r) => [r.name, r.id]));

  const [seoulAdmin, seoulStaff, seoulViewer, busanAdmin] = await Promise.all([
    prisma.user.create({ data: { email: 'admin@seoul.go.kr', name: 'Seoul Admin', tenantId: seoul.id } }),
    prisma.user.create({ data: { email: 'staff@seoul.go.kr', name: 'Seoul Staff', tenantId: seoul.id } }),
    prisma.user.create({ data: { email: 'viewer@seoul.go.kr', name: 'Seoul Viewer', tenantId: seoul.id } }),
    prisma.user.create({ data: { email: 'admin@busan.go.kr', name: 'Busan Admin', tenantId: busan.id } }),
  ]);

  await prisma.userRole.createMany({
    data: [
      { userId: seoulAdmin.id, roleId: roleByName.get(RoleName.ADMIN)! },
      { userId: seoulStaff.id, roleId: roleByName.get(RoleName.STAFF)! },
      { userId: seoulViewer.id, roleId: roleByName.get(RoleName.VIEWER)! },
      { userId: busanAdmin.id, roleId: roleByName.get(RoleName.ADMIN)! },
    ],
  });

  const [seoulPetition, busanPetition] = await Promise.all([
    prisma.petition.create({ data: { title: 'A', content: 'A', tenantId: seoul.id } }),
    prisma.petition.create({ data: { title: 'B', content: 'B', tenantId: busan.id } }),
  ]);

  return {
    seoul: {
      code: seoul.code,
      adminEmail: seoulAdmin.email,
      staffEmail: seoulStaff.email,
      viewerEmail: seoulViewer.email,
      petitionId: seoulPetition.id,
    },
    busan: {
      code: busan.code,
      adminEmail: busanAdmin.email,
      petitionId: busanPetition.id,
    },
  };
}

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  ctx = await seed();
});

describe('tenant isolation', () => {
  it('denies access to petition from another tenant', async () => {
    const res = await request(app)
      .get(`/petitions/${ctx.busan.petitionId}`)
      .set('X-USER-EMAIL', ctx.seoul.adminEmail)
      .set('X-TENANT-CODE', ctx.seoul.code);

    expect(res.status).toBe(404);
  });
});

describe('rbac', () => {
  it('VIEWER cannot POST petition', async () => {
    const res = await request(app)
      .post('/petitions')
      .set('X-USER-EMAIL', ctx.seoul.viewerEmail)
      .set('X-TENANT-CODE', ctx.seoul.code)
      .send({ title: 'x', content: 'y' });

    expect(res.status).toBe(403);
  });

  it('VIEWER cannot DELETE petition', async () => {
    const res = await request(app)
      .delete(`/petitions/${ctx.seoul.petitionId}`)
      .set('X-USER-EMAIL', ctx.seoul.viewerEmail)
      .set('X-TENANT-CODE', ctx.seoul.code);

    expect(res.status).toBe(403);
  });

  it('STAFF cannot register audit corpus document', async () => {
    const res = await request(app)
      .post('/audit-corpus-documents')
      .set('X-USER-EMAIL', ctx.seoul.staffEmail)
      .set('X-TENANT-CODE', ctx.seoul.code)
      .send({ title: 'doc', body: 'body' });

    expect(res.status).toBe(403);
  });

  it('ADMIN can perform privileged operations', async () => {
    const postRes = await request(app)
      .post('/audit-corpus-documents')
      .set('X-USER-EMAIL', ctx.seoul.adminEmail)
      .set('X-TENANT-CODE', ctx.seoul.code)
      .send({ title: 'doc', body: 'body' });
    expect(postRes.status).toBe(201);

    const deleteRes = await request(app)
      .delete(`/petitions/${ctx.seoul.petitionId}`)
      .set('X-USER-EMAIL', ctx.seoul.adminEmail)
      .set('X-TENANT-CODE', ctx.seoul.code);
    expect(deleteRes.status).toBe(204);
  });
});
