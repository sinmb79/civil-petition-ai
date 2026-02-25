import { InMemoryVectorStore } from '../packages/core/in-memory-vector-store.js';

export function readVectorMode(env = process.env) {
  const mode = env.VECTOR_MODE ?? 'off';
  return ['off', 'local', 'openai'].includes(mode) ? mode : 'off';
}

export class EmbeddingService {
  constructor(mode, openAIClient, dimensions = 64) {
    this.mode = mode;
    this.openAIClient = openAIClient;
    this.localStore = new InMemoryVectorStore(dimensions);
  }

  async embed(rawTextMasked) {
    if (this.mode === 'off') return null;
    if (this.mode === 'openai') {
      if (!this.openAIClient) throw new Error('OpenAI embedding client is required for VECTOR_MODE=openai');
      return this.openAIClient.embed(rawTextMasked);
    }
    return this.localStore.embed(rawTextMasked);
  }
}
