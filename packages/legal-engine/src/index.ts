import type { Citation, PetitionInput } from '@civil/core';

export interface LegalRetriever {
  retrieveForPetition(petition: PetitionInput): Promise<Citation[]>;
}

export class LegalEngine {
  constructor(private readonly legalRetriever: LegalRetriever) {}

  async getLegalSources(petition: PetitionInput): Promise<Citation[]> {
    return this.legalRetriever.retrieveForPetition(petition);
  }
}
