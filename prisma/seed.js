import { createDb } from '../src/db.js';
import { Roles } from '../src/rbac.js';

export function seedBase() {
  const db = createDb();

  const tenantA = db.createTenant('Seoul City Hall', 'SEOUL');
  const tenantB = db.createTenant('Busan District Office', 'BUSAN');

  const adminRole = db.createRole(Roles.ADMIN);
  const viewerRole = db.createRole(Roles.VIEWER);
  db.createRole(Roles.MANAGER);
  db.createRole(Roles.STAFF);

  const userA = db.createUser('admin@seoul.go.kr', 'Seoul Admin', tenantA.id);
  const userB = db.createUser('viewer@busan.go.kr', 'Busan Viewer', tenantB.id);

  db.assignRole(userA.id, adminRole.id);
  db.assignRole(userB.id, viewerRole.id);

  return db;
}
