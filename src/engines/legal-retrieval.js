const legalCache = new Map();

export function retrieveLegalSources(petition, legalSources) {
  const cacheKey = `${petition.processing_type}:${petition.raw_text}:${petition.budget_related}:${petition.discretionary}`;
  const cached = legalCache.get(cacheKey);
  if (cached) return cached;

  const loweredText = petition.raw_text.toLowerCase();
  const matched = legalSources.filter((source) => {
    const matchesKeyword = source.keywords.some((keyword) => loweredText.includes(keyword.toLowerCase()));
    const transferFallback = petition.processing_type === "TRANSFER" && source.processing_types.includes("TRANSFER");
    return matchesKeyword || transferFallback;
  });

  legalCache.set(cacheKey, matched);
  return matched;
}

export function clearLegalCache() {
  legalCache.clear();
}
