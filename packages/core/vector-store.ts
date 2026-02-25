export type VectorMetadata = Record<string, unknown>;

export interface VectorQueryResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
}

export interface VectorStore {
  embed(text: string): number[];
  upsert(id: string, vector: number[], metadata: VectorMetadata): void;
  query(vector: number[], topK: number): VectorQueryResult[];
}
