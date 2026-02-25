export class PetitionService {
  constructor(vectorMode, vectorStore, embeddingService) {
    this.vectorMode = vectorMode;
    this.vectorStore = vectorStore;
    this.embeddingService = embeddingService;
    this.petitions = new Map();
    this.draftReplies = new Map();
  }

  async createPetition(input) {
    const timestamp = new Date().toISOString();
    const petition = { ...input, created_at: timestamp, updated_at: timestamp };
    this.petitions.set(input.id, petition);
    await this.indexPetition(petition);
    return petition;
  }

  async updatePetition(id, patch) {
    const existing = this.petitions.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updated_at: new Date().toISOString() };
    this.petitions.set(id, updated);
    await this.indexPetition(updated);
    return updated;
  }

  async completeDraftReply(input) {
    const timestamp = new Date().toISOString();
    const draft = { ...input, created_at: timestamp, updated_at: timestamp };
    this.draftReplies.set(input.id, draft);
    const petition = this.petitions.get(input.petition_id);
    if (petition) {
      petition.decision = draft.decision;
      petition.updated_at = timestamp;
      this.petitions.set(petition.id, petition);
      await this.indexPetition(petition, draft.summary_text);
    }
    return draft;
  }

  getPetition(id) {
    return this.petitions.get(id) ?? null;
  }

  async findSimilarPetitions(id, topK) {
    const petition = this.petitions.get(id);
    if (!petition) return [];

    if (this.vectorMode !== 'off') {
      const vector = await this.embeddingService.embed(petition.raw_text_masked);
      if (!vector) return [];
      const results = await this.vectorStore.query(vector, topK + 1);
      return results.filter((r) => r.id !== id).slice(0, topK).map((r) => ({
        score: r.score,
        petition_id: r.id,
        petition_summary: String(r.metadata.petition_summary ?? ''),
        decision: r.metadata.decision ?? null,
      }));
    }

    return this.keywordFallback(petition, topK);
  }

  async indexPetition(petition, draftSummary = '') {
    if (this.vectorMode === 'off') return;
    const vector = await this.embeddingService.embed(`${petition.raw_text_masked}\n${draftSummary}`.trim());
    if (!vector) return;
    await this.vectorStore.upsert(petition.id, vector, {
      petition_summary: petition.petition_summary,
      decision: petition.decision ?? null,
      updated_at: petition.updated_at,
    });
  }

  keywordFallback(petition, topK) {
    const targetTokens = new Set(tokenize(petition.raw_text_masked));
    return [...this.petitions.values()]
      .filter((candidate) => candidate.id !== petition.id)
      .map((candidate) => {
        const overlap = tokenize(candidate.raw_text_masked).filter((t) => targetTokens.has(t)).length;
        return {
          score: overlap / Math.max(targetTokens.size, 1),
          petition_id: candidate.id,
          petition_summary: candidate.petition_summary,
          decision: candidate.decision ?? null,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

function tokenize(text) {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}
