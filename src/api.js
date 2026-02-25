import { Roles, requireRole } from './rbac.js';

export function createApi(db) {
  function authenticate(headers) {
    const auth = db.getAuthContext(headers['X-USER-EMAIL'], headers['X-TENANT-CODE']);
    if (!auth) return { error: { status: 401, message: 'Unauthorized' } };
    return { auth };
  }

  function getPetition(headers, petitionId) {
    const { auth, error } = authenticate(headers);
    if (error) return error;

    const allowed = requireRole(auth, [Roles.ADMIN, Roles.MANAGER, Roles.STAFF, Roles.VIEWER]);
    if (!allowed.ok) return { status: allowed.status, message: allowed.message };

    const petition = db.getPetitionById(auth, petitionId);
    if (!petition) return { status: 404, message: 'Not found' };
    return { status: 200, data: petition };
  }

  function postPetition(headers, body) {
    const { auth, error } = authenticate(headers);
    if (error) return error;

    const allowed = requireRole(auth, [Roles.ADMIN, Roles.MANAGER, Roles.STAFF]);
    if (!allowed.ok) return { status: allowed.status, message: allowed.message };

    const petition = db.createPetition(auth, body.title, body.content);
    return { status: 201, data: petition };
  }

  function deletePetition(headers, petitionId) {
    const { auth, error } = authenticate(headers);
    if (error) return error;

    const allowed = requireRole(auth, [Roles.ADMIN]);
    if (!allowed.ok) return { status: allowed.status, message: allowed.message };

    const deleted = db.deletePetition(auth, petitionId);
    if (!deleted) return { status: 404, message: 'Not found' };
    return { status: 204 };
  }

  function postAuditCorpus(headers, body) {
    const { auth, error } = authenticate(headers);
    if (error) return error;

    const allowed = requireRole(auth, [Roles.ADMIN, Roles.MANAGER]);
    if (!allowed.ok) return { status: allowed.status, message: allowed.message };

    const doc = db.createAuditCorpusDocument(auth, body.title, body.body);
    return { status: 201, data: doc };
  }

  return { getPetition, postPetition, deletePetition, postAuditCorpus };
}
