import type { LegalApiAdapter, LegalSource } from '../types.js';

export class LegalRetrievalEngine {
  constructor(private readonly adapter: LegalApiAdapter) {}

  async retrieve(petitionId: string, rawText: string): Promise<LegalSource[]> {
    return this.adapter.retrieveForPetition({ petitionId, rawText });
  }
}
