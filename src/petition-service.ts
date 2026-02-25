import { VectorStore } from '../packages/core/vector-store.js';
import { EmbeddingService, VectorMode } from './embedding.js';
import { DraftReply, Petition } from './models.js';

export class PetitionService {
  private readonly petitions = new Map<string, Petition>();
  private readonly draftReplies = new Map<string, DraftReply>();

  constructor(
    private readonly vectorMode: VectorMode,
    private readonly vectorStore: VectorStore,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async createPetition(input: Omit<Petition, 'created_at' | 'updated_at'>): Promise<Petition> {
    const timestamp = new Date().toISOString();
    const petition: Petition = { ...input, created_at: timestamp, updated_at: timestamp };
    this.petitions.set(input.id, petition);
    await this.indexPetition(petition);
    return petition;
  }

  async updatePetition(id: string, patch: Partial<Omit<Petition, 'id' | 'created_at' | 'updated_at'>>): Promise<Petition | null> {
    const existing = this.petitions.get(id);
    if (!existing) {
      return null;
    }

    const updated: Petition = { ...existing, ...patch, updated_at: new Date().toISOString() };
    this.petitions.set(id, updated);
    await this.indexPetition(updated);
    return updated;
  }

  async completeDraftReply(input: Omit<DraftReply, 'created_at' | 'updated_at'>): Promise<DraftReply> {
    const timestamp = new Date().toISOString();
    const draft: DraftReply = { ...input, created_at: timestamp, updated_at: timestamp };
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

  getPetition(id: string): Petition | null {
    return this.petitions.get(id) ?? null;
  }

  async findSimilarPetitions(id: string, topK: number): Promise<Array<{ score: number; petition_id: string; petition_summary: string; decision: string | null }>> {
    const petition = this.petitions.get(id);
    if (!petition) {
      return [];
    }

    if (this.vectorMode !== 'off') {
      const vector = await this.embeddingService.embed(petition.raw_text_masked);
      if (!vector) {
        return [];
      }

      const results = await this.vectorStore.query(vector, topK + 1);
      return results
        .filter((result) => result.id !== id)
        .slice(0, topK)
        .map((result) => ({
          score: result.score,
          petition_id: result.id,
          petition_summary: String(result.metadata.petition_summary ?? ''),
          decision: (result.metadata.decision as string | undefined) ?? null,
        }));
    }

    return this.keywordFallback(petition, topK);
  }

  private async indexPetition(petition: Petition, draftSummary?: string): Promise<void> {
    if (this.vectorMode === 'off') {
      return;
    }

    const embeddingBase = `${petition.raw_text_masked}\n${draftSummary ?? ''}`.trim();
    const vector = await this.embeddingService.embed(embeddingBase);
    if (!vector) {
      return;
    }

    await this.vectorStore.upsert(petition.id, vector, {
      petition_summary: petition.petition_summary,
      decision: petition.decision ?? null,
      updated_at: petition.updated_at,
    });
  }

  private keywordFallback(petition: Petition, topK: number): Array<{ score: number; petition_id: string; petition_summary: string; decision: string | null }> {
    const targetTokens = new Set(tokenize(petition.raw_text_masked));
    return [...this.petitions.values()]
      .filter((candidate) => candidate.id !== petition.id)
      .map((candidate) => {
        const candidateTokens = tokenize(candidate.raw_text_masked);
        const overlap = candidateTokens.filter((token) => targetTokens.has(token)).length;
        const score = overlap / Math.max(targetTokens.size, 1);
        return {
          score,
          petition_id: candidate.id,
          petition_summary: candidate.petition_summary,
          decision: candidate.decision ?? null,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}
