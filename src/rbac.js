export const Roles = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  VIEWER: 'VIEWER',
};

export function requireRole(auth, allowedRoles) {
  if (!auth) {
    return { ok: false, status: 401, message: 'Unauthorized' };
  }

  const hasRole = auth.roles.some((role) => allowedRoles.includes(role));
  if (!hasRole) {
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  return { ok: true };
}
