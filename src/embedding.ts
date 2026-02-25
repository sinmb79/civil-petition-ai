import { InMemoryVectorStore } from '../packages/core/in-memory-vector-store.js';

export type VectorMode = 'off' | 'local' | 'openai';

export interface OpenAIEmbeddingClient {
  embed(input: string): Promise<number[]>;
}

export function readVectorMode(env: NodeJS.ProcessEnv = process.env): VectorMode {
  const mode = env.VECTOR_MODE ?? 'off';
  if (mode === 'off' || mode === 'local' || mode === 'openai') {
    return mode;
  }
  return 'off';
}

export class EmbeddingService {
  private readonly localStore: InMemoryVectorStore;

  constructor(
    private readonly mode: VectorMode,
    private readonly openAIClient?: OpenAIEmbeddingClient,
    dimensions = 64,
  ) {
    this.localStore = new InMemoryVectorStore(dimensions);
  }

  async embed(rawTextMasked: string): Promise<number[] | null> {
    if (this.mode === 'off') {
      return null;
    }

    if (this.mode === 'openai') {
      if (!this.openAIClient) {
        throw new Error('OpenAI embedding client is required for VECTOR_MODE=openai');
      }
      return this.openAIClient.embed(rawTextMasked);
    }

    return this.localStore.embed(rawTextMasked);
  }
}
