const SEARCH_TTL_SECONDS = 24 * 60 * 60;
const ARTICLES_TTL_SECONDS = 7 * 24 * 60 * 60;
const normalizeQuery = (query) => query.trim().toLowerCase().replace(/\s+/g, ' ');

export class LegalService {
  constructor(cache, lawApiClient, logger) {
    this.cache = cache;
    this.lawApiClient = lawApiClient;
    this.logger = logger;
  }

  async searchLaws(query, requestId) {
    const normalized = normalizeQuery(query);
    const key = `law:search:${normalized}`;
    const cached = await this.cache.get(key);
    if (cached) {
      this.logger.lawApiCall({ request_id: requestId, endpoint: 'search', latency_ms: 0, cache_hit: true, retry_count: 0, result_count: cached.value.length });
      return cached.value;
    }
    const laws = await this.lawApiClient.searchLaws(query, requestId);
    await this.cache.set(key, { value: laws, effectiveDate: laws[0]?.effective_date, fetchedAt: new Date().toISOString() }, SEARCH_TTL_SECONDS);
    return laws;
  }

  async getLawArticles(lawId, requestId) {
    const key = `law:articles:${lawId}`;
    const cached = await this.cache.get(key);
    if (cached) {
      this.logger.lawApiCall({ request_id: requestId, endpoint: 'articles', latency_ms: 0, cache_hit: true, retry_count: 0, result_count: cached.value.length });
      return cached.value;
    }
    const articles = await this.lawApiClient.getLawArticles(lawId, requestId);
    await this.cache.set(key, { value: articles, effectiveDate: articles[0]?.effective_date, fetchedAt: new Date().toISOString() }, ARTICLES_TTL_SECONDS);
    return articles;
  }
}
