import { LawApiClient, LawArticle, LawSummary } from '../../../integrations/law-api/client.js';
import { Logger } from '../../logger/src/index.js';
import { ILegalCache } from './cache/types.js';

const SEARCH_TTL_SECONDS = 24 * 60 * 60;
const ARTICLES_TTL_SECONDS = 7 * 24 * 60 * 60;

const normalizeQuery = (query: string) => query.trim().toLowerCase().replace(/\s+/g, ' ');

export class LegalService {
  constructor(
    private readonly cache: ILegalCache,
    private readonly lawApiClient: LawApiClient,
    private readonly logger: Logger,
  ) {}

  async searchLaws(query: string, requestId: string): Promise<LawSummary[]> {
    const normalized = normalizeQuery(query);
    const key = `law:search:${normalized}`;
    const cached = await this.cache.get<LawSummary[]>(key);

    if (cached) {
      this.logger.lawApiCall({
        request_id: requestId,
        endpoint: 'search',
        latency_ms: 0,
        cache_hit: true,
        retry_count: 0,
        result_count: cached.value.length,
      });
      return cached.value;
    }

    const laws = await this.lawApiClient.searchLaws(query, requestId);
    await this.cache.set(key, { value: laws, effectiveDate: laws[0]?.effective_date, fetchedAt: new Date().toISOString() }, SEARCH_TTL_SECONDS);
    return laws;
  }

  async getLawArticles(lawId: string, requestId: string): Promise<LawArticle[]> {
    const key = `law:articles:${lawId}`;
    const cached = await this.cache.get<LawArticle[]>(key);

    if (cached) {
      this.logger.lawApiCall({
        request_id: requestId,
        endpoint: 'articles',
        latency_ms: 0,
        cache_hit: true,
        retry_count: 0,
        result_count: cached.value.length,
      });
      return cached.value;
    }

    const articles = await this.lawApiClient.getLawArticles(lawId, requestId);
    await this.cache.set(key, { value: articles, effectiveDate: articles[0]?.effective_date, fetchedAt: new Date().toISOString() }, ARTICLES_TTL_SECONDS);
    return articles;
  }
}
