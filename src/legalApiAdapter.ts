import type { LegalApiAdapter } from './types.js';

export const stubLegalApiAdapter: LegalApiAdapter = {
  async retrieveForPetition() {
    return [];
  },
};
