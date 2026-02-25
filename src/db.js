import { randomUUID } from 'node:crypto';

export function createDb() {
  const state = {
    tenants: [],
    users: [],
    roles: [],
    userRoles: [],
    petitions: [],
    draftReplies: [],
    auditFindings: [],
    auditCorpusDocuments: [],
    auditCases: [],
  };

  function reset() {
    Object.keys(state).forEach((key) => {
      state[key] = [];
    });
  }

  function createTenant(name, code) {
    const now = new Date().toISOString();
    const tenant = { id: randomUUID(), name, code, created_at: now, updated_at: now };
    state.tenants.push(tenant);
    return tenant;
  }

  function createRole(name) {
    const now = new Date().toISOString();
    const role = { id: randomUUID(), name, created_at: now, updated_at: now };
    state.roles.push(role);
    return role;
  }

  function createUser(email, name, tenant_id) {
    const now = new Date().toISOString();
    const user = { id: randomUUID(), email, name, tenant_id, created_at: now, updated_at: now };
    state.users.push(user);
    return user;
  }

  function assignRole(user_id, role_id) {
    const exists = state.userRoles.find((x) => x.user_id === user_id && x.role_id === role_id);
    if (!exists) state.userRoles.push({ user_id, role_id });
  }

  function getAuthContext(email, tenantCode) {
    if (!email || !tenantCode) return null;
    const tenant = state.tenants.find((t) => t.code === tenantCode);
    if (!tenant) return null;
    const user = state.users.find((u) => u.email === email && u.tenant_id === tenant.id);
    if (!user) return null;

    const roles = state.userRoles
      .filter((ur) => ur.user_id === user.id)
      .map((ur) => state.roles.find((r) => r.id === ur.role_id)?.name)
      .filter(Boolean);

    return { userId: user.id, tenantId: tenant.id, tenantCode: tenant.code, roles };
  }

  function createPetition(auth, title, content) {
    const now = new Date().toISOString();
    const petition = { id: randomUUID(), title, content, tenant_id: auth.tenantId, created_at: now, updated_at: now };
    state.petitions.push(petition);
    return petition;
  }

  function getPetitionById(auth, petitionId) {
    return state.petitions.find((p) => p.id === petitionId && p.tenant_id === auth.tenantId) ?? null;
  }

  function deletePetition(auth, petitionId) {
    const idx = state.petitions.findIndex((p) => p.id === petitionId && p.tenant_id === auth.tenantId);
    if (idx === -1) return false;
    state.petitions.splice(idx, 1);
    return true;
  }

  function createAuditCorpusDocument(auth, title, body) {
    const now = new Date().toISOString();
    const doc = { id: randomUUID(), title, body, tenant_id: auth.tenantId, created_at: now, updated_at: now };
    state.auditCorpusDocuments.push(doc);
    return doc;
  }

  return {
    state,
    reset,
    createTenant,
    createRole,
    createUser,
    assignRole,
    getAuthContext,
    createPetition,
    getPetitionById,
    deletePetition,
    createAuditCorpusDocument,
  };
}
