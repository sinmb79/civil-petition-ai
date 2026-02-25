import { searchAuditCorpusCases } from '../../services/auditCorpusService.js';

export class AuditCorpusProvider {
  async searchCases(query, limit = 5) {
    return searchAuditCorpusCases(query, limit);
  }
}
