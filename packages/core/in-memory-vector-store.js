export class InMemoryVectorStore {
  constructor(dimensions = 64) {
    this.vectors = new Map();
    this.dimensions = dimensions;
  }

  embed(text) {
    const vector = new Array(this.dimensions).fill(0);
    for (const token of tokenize(text)) {
      let hash = 2166136261;
      for (let i = 0; i < token.length; i += 1) {
        hash ^= token.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      const index = Math.abs(hash) % this.dimensions;
      vector[index] += 1;
    }
    return normalize(vector);
  }

  upsert(id, vector, metadata) {
    this.vectors.set(id, { vector: normalize(vector), metadata });
  }

  query(vector, topK) {
    const normalized = normalize(vector);
    return [...this.vectors.entries()]
      .map(([id, entry]) => ({ id, score: cosineSimilarity(normalized, entry.vector), metadata: entry.metadata }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

export function cosineSimilarity(a, b) {
  const length = Math.max(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i += 1) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function tokenize(text) {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

function normalize(vector) {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (!norm) return vector;
  return vector.map((v) => v / norm);
}
