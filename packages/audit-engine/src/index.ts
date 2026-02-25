import type { AuditRisk, Citation, PetitionInput } from '@civil/core';

export interface AuditAssessor {
  assess(input: { petition: PetitionInput; legalBasis: Citation[] }): Promise<AuditRisk>;
}

export class AuditEngine {
  constructor(private readonly assessor: AuditAssessor) {}

  async evaluate(input: { petition: PetitionInput; legalBasis: Citation[] }): Promise<AuditRisk> {
    return this.assessor.assess(input);
  }
}
