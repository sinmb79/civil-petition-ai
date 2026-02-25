function tokenize(text) {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

export async function indexAuditCases(auditCases, vectorMode, embeddingService, vectorStore) {
  if (vectorMode === 'off') return;
  for (const auditCase of auditCases) {
    const vector = await embeddingService.embed(`${auditCase.title} ${auditCase.description}`);
    if (!vector) continue;
    await vectorStore.upsert(`audit:${auditCase.id}`, vector, { auditCase });
  }
}

export async function matchAuditCases(queryText, auditCases, vectorMode, embeddingService, vectorStore, options = {}) {
  const topK = options.topK ?? 5;
  const similarityThreshold = options.similarityThreshold ?? 0.55;
  const targetTokens = new Set(tokenize(queryText));

  const keywordMatches = auditCases.map((auditCase) => {
    const overlap = tokenize(`${auditCase.title} ${auditCase.description}`).filter((t) => targetTokens.has(t)).length;
    const keywordScore = overlap / Math.max(targetTokens.size, 1);
    return { auditCase, keywordScore, vectorScore: 0, score: keywordScore };
  });

  if (vectorMode === 'off') return keywordMatches.sort((a, b) => b.score - a.score).slice(0, topK);

  const queryVector = await embeddingService.embed(queryText);
  if (!queryVector) return keywordMatches.sort((a, b) => b.score - a.score).slice(0, topK);

  const vectorMatches = await vectorStore.query(queryVector, Math.max(topK * 2, 10));
  const vectorScoreByCase = new Map();
  for (const m of vectorMatches) {
    if (m.id.startsWith('audit:')) vectorScoreByCase.set(m.id.replace('audit:', ''), m.score);
  }

  return keywordMatches
    .map((m) => ({ ...m, vectorScore: vectorScoreByCase.get(m.auditCase.id) ?? 0 }))
    .map((m) => ({ ...m, score: Math.max(m.keywordScore, m.vectorScore) }))
    .filter((m) => m.score >= Math.min(similarityThreshold, 0.2) || m.keywordScore > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function evaluateR6RepeatedFinding(matches, similarityThreshold = 0.72) {
  return matches.filter((m) => m.vectorScore >= similarityThreshold || m.keywordScore >= similarityThreshold).length >= 2;
}
