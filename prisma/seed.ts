import { RoleName } from '@prisma/client';
import { prisma } from '../src/prisma.js';

async function main() {
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.auditCase.deleteMany();
  await prisma.auditCorpusDocument.deleteMany();
  await prisma.auditFinding.deleteMany();
  await prisma.draftReply.deleteMany();
  await prisma.petition.deleteMany();
  await prisma.tenant.deleteMany();

  const [tenantA, tenantB] = await Promise.all([
    prisma.tenant.create({ data: { name: 'Seoul City Hall', code: 'SEOUL' } }),
    prisma.tenant.create({ data: { name: 'Busan District Office', code: 'BUSAN' } }),
  ]);

  const roles = await Promise.all(
    [RoleName.ADMIN, RoleName.MANAGER, RoleName.STAFF, RoleName.VIEWER].map((name) =>
      prisma.role.create({ data: { name } }),
    ),
  );

  const roleByName = new Map(roles.map((r) => [r.name, r.id]));

  const adminUser = await prisma.user.create({
    data: { email: 'admin@seoul.go.kr', name: 'Seoul Admin', tenantId: tenantA.id },
  });

  const viewerUser = await prisma.user.create({
    data: { email: 'viewer@busan.go.kr', name: 'Busan Viewer', tenantId: tenantB.id },
  });

  await prisma.userRole.createMany({
    data: [
      { userId: adminUser.id, roleId: roleByName.get(RoleName.ADMIN)! },
      { userId: viewerUser.id, roleId: roleByName.get(RoleName.VIEWER)! },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
