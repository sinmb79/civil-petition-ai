export class AuditLogService {
  constructor(repo) {
    this.repo = repo;
  }

  async logAction(input) {
    await this.repo.create({
      tenant_id: input.tenantId,
      user_id: input.userId,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId,
      metadata: {
        request_id: input.context?.requestId ?? null,
        ip: input.context?.ip ?? null,
        user_agent: input.context?.userAgent ?? null
      }
    });
  }
}
