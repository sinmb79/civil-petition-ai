const SEARCH_CACHE_PREFIX = 'law-search';
const ARTICLES_CACHE_PREFIX = 'law-articles';

export class LegalRetrievalEngine {
  constructor(lawApiClient, cache) {
    this.lawApiClient = lawApiClient;
    this.cache = cache;
  }

  async findRelevantSources(petitionText, keywords) {
    const searchTerms = this.buildSearchTerms(petitionText, keywords);
    const lawsById = new Map();

    for (const term of searchTerms) {
      const laws = await this.searchLawsWithCache(term);
      for (const law of laws) {
        lawsById.set(law.id, law);
      }
    }

    const sources = [];
    for (const law of lawsById.values()) {
      const articles = await this.getLawArticlesWithCache(law.id);
      for (const article of articles) {
        sources.push({
          source_type: 'STATUTE',
          title: law.title,
          reference_number: law.id,
          article: article.article_no,
          effective_date: article.effective_date,
          content: article.text,
          source_url: article.url || law.url,
        });
      }
    }

    return sources;
  }

  buildSearchTerms(petitionText, keywords) {
    const cleanedKeywords = keywords.map((keyword) => keyword.trim()).filter(Boolean);
    if (cleanedKeywords.length > 0) {
      return [...new Set(cleanedKeywords)];
    }

    const fallback = petitionText.trim();
    return fallback ? [fallback] : [];
  }

  async searchLawsWithCache(query) {
    const cacheKey = `${SEARCH_CACHE_PREFIX}:${query}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached.data;
    }

    const laws = await this.lawApiClient.searchLaws(query);
    await this.cache.set(cacheKey, this.toCachedValue(laws));
    return laws;
  }

  async getLawArticlesWithCache(lawId) {
    const cacheKey = `${ARTICLES_CACHE_PREFIX}:${lawId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached.data;
    }

    const articles = await this.lawApiClient.getLawArticles(lawId);
    await this.cache.set(cacheKey, this.toCachedValue(articles));
    return articles;
  }

  toCachedValue(items) {
    return {
      effective_date: items[0]?.effective_date ?? '',
      data: items,
    };
  }
}
