import { maskPIIForStorage } from '../../core/pii.js';

export class PetitionService {
  constructor(repo, audit, config) {
    this.repo = repo;
    this.audit = audit;
    this.config = config;
  }

  async createPetition(input) {
    const storageMasked = maskPIIForStorage(input.rawText);
    const storedRaw = this.config.storeRawPetitionText ? input.rawText : null;

    const petition = await this.repo.create({
      tenant_id: input.tenantId,
      raw_text: storedRaw,
      raw_text_masked: storageMasked.masked,
      pii_detected: storageMasked.piiDetected,
      pii_types: storageMasked.piiTypes
    });

    await this.audit.logAction({
      tenantId: input.tenantId,
      userId: input.user.userId,
      action: 'PETITION_CREATE',
      resourceType: 'Petition',
      resourceId: petition.id,
      context: input.context
    });

    return petition;
  }

  async getPetition(id, tenantId, user, context) {
    const petition = await this.repo.findById(id);
    if (!petition || petition.tenant_id !== tenantId) throw new Error('petition not found');

    await this.audit.logAction({
      tenantId,
      userId: user.userId,
      action: 'PETITION_VIEW',
      resourceType: 'Petition',
      resourceId: petition.id,
      context
    });

    const canViewRaw = this.config.rawTextVisibleRoles.includes(user.role);
    if (canViewRaw && petition.raw_text) {
      return { id: petition.id, text: petition.raw_text, masked: false, pii_types: petition.pii_types };
    }

    return {
      id: petition.id,
      text: petition.raw_text_masked,
      masked: true,
      pii_types: petition.pii_types
    };
  }

  async updatePetition(id, tenantId, rawText, user, context) {
    const masked = maskPIIForStorage(rawText);
    const raw = this.config.storeRawPetitionText ? rawText : null;
    const updated = await this.repo.update(id, {
      tenant_id: tenantId,
      raw_text: raw,
      raw_text_masked: masked.masked,
      pii_detected: masked.piiDetected,
      pii_types: masked.piiTypes
    });

    await this.audit.logAction({
      tenantId,
      userId: user.userId,
      action: 'PETITION_UPDATE',
      resourceType: 'Petition',
      resourceId: id,
      context
    });

    return updated;
  }

  async deletePetition(id, tenantId, user, context) {
    await this.repo.delete(id);
    await this.audit.logAction({
      tenantId,
      userId: user.userId,
      action: 'PETITION_DELETE',
      resourceType: 'Petition',
      resourceId: id,
      context
    });
  }

  async requestDraftGeneration(petitionId, tenantId, user, context) {
    await this.audit.logAction({
      tenantId,
      userId: user.userId,
      action: 'DRAFT_GENERATE_REQUEST',
      resourceType: 'Draft',
      resourceId: petitionId,
      context
    });
  }

  async registerAuditCorpusDoc(docId, tenantId, user, context) {
    await this.audit.logAction({
      tenantId,
      userId: user.userId,
      action: 'AUDIT_CORPUS_REGISTER',
      resourceType: 'AuditCorpus',
      resourceId: docId,
      context
    });
  }

  async searchAuditCorpus(queryId, tenantId, user, context) {
    await this.audit.logAction({
      tenantId,
      userId: user.userId,
      action: 'AUDIT_CORPUS_SEARCH',
      resourceType: 'AuditCorpus',
      resourceId: queryId,
      context
    });
  }
}
