import type { AuditRisk, Citation, PetitionInput } from '@civil/core';

export interface DraftRenderer {
  render(input: {
    petition: PetitionInput;
    legalBasis: Citation[];
    auditRisk: AuditRisk;
  }): Promise<string>;
}

export class DraftEngine {
  constructor(private readonly renderer: DraftRenderer) {}

  async generateDraft(input: {
    petition: PetitionInput;
    legalBasis: Citation[];
    auditRisk: AuditRisk;
  }): Promise<string> {
    return this.renderer.render(input);
  }
}
