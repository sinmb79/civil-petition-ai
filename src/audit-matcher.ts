import { VectorStore } from '../packages/core/vector-store.js';
import { EmbeddingService, VectorMode } from './embedding.js';
import { AuditCase } from './models.js';

export interface AuditMatchOptions {
  topK?: number;
  similarityThreshold?: number;
}

export interface MatchedAuditCase {
  auditCase: AuditCase;
  keywordScore: number;
  vectorScore: number;
  score: number;
}

export async function indexAuditCases(
  auditCases: AuditCase[],
  vectorMode: VectorMode,
  embeddingService: EmbeddingService,
  vectorStore: VectorStore,
): Promise<void> {
  if (vectorMode === 'off') {
    return;
  }

  for (const auditCase of auditCases) {
    const vector = await embeddingService.embed(`${auditCase.title} ${auditCase.description}`);
    if (!vector) {
      continue;
    }
    await vectorStore.upsert(`audit:${auditCase.id}`, vector, { auditCase });
  }
}

export async function matchAuditCases(
  queryText: string,
  auditCases: AuditCase[],
  vectorMode: VectorMode,
  embeddingService: EmbeddingService,
  vectorStore: VectorStore,
  options: AuditMatchOptions = {},
): Promise<MatchedAuditCase[]> {
  const topK = options.topK ?? 5;
  const similarityThreshold = options.similarityThreshold ?? 0.55;
  const targetTokens = new Set(tokenize(queryText));

  const keywordMatches = auditCases.map((auditCase) => {
    const caseTokens = tokenize(`${auditCase.title} ${auditCase.description}`);
    const overlap = caseTokens.filter((token) => targetTokens.has(token)).length;
    const keywordScore = overlap / Math.max(targetTokens.size, 1);
    return {
      auditCase,
      keywordScore,
      vectorScore: 0,
      score: keywordScore,
    };
  });

  if (vectorMode === 'off') {
    return keywordMatches.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  const queryVector = await embeddingService.embed(queryText);
  if (!queryVector) {
    return keywordMatches.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  const vectorMatches = await vectorStore.query(queryVector, Math.max(topK * 2, 10));
  const vectorScoreByCase = new Map<string, number>();
  for (const match of vectorMatches) {
    if (!match.id.startsWith('audit:')) {
      continue;
    }
    vectorScoreByCase.set(match.id.replace('audit:', ''), match.score);
  }

  return keywordMatches
    .map((match) => {
      const vectorScore = vectorScoreByCase.get(match.auditCase.id) ?? 0;
      const score = Math.max(match.keywordScore, vectorScore);
      return {
        ...match,
        vectorScore,
        score,
      };
    })
    .filter((match) => match.score >= Math.min(similarityThreshold, 0.2) || match.keywordScore > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function evaluateR6RepeatedFinding(matches: MatchedAuditCase[], similarityThreshold = 0.72): boolean {
  const highConfidenceMatches = matches.filter((match) => match.vectorScore >= similarityThreshold || match.keywordScore >= similarityThreshold);
  return highConfidenceMatches.length >= 2;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}
