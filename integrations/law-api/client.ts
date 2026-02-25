import { AppConfig } from '../../packages/core/config.js';
import { Logger } from '../../packages/logger/src/index.js';
import { IRateLimiter, SlidingWindowRateLimiter } from './rateLimiter.js';
import { RateLimitError, TimeoutError, UpstreamError } from './errors.js';

export interface LawSummary {
  id: string;
  title: string;
  effective_date: string;
  url: string;
}

export interface LawArticle {
  article_no: string;
  text: string;
  effective_date: string;
  url: string;
}

interface FetchOptions {
  method: string;
  headers: Record<string, string>;
  signal: AbortSignal;
}

type FetchLike = (url: string, init: FetchOptions) => Promise<Response>;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export class LawApiClient {
  private readonly fetchImpl: FetchLike;
  private readonly rateLimiter: IRateLimiter;

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
    deps?: {
      fetchImpl?: FetchLike;
      rateLimiter?: IRateLimiter;
    },
  ) {
    this.fetchImpl = deps?.fetchImpl ?? (fetch as FetchLike);
    this.rateLimiter = deps?.rateLimiter ?? new SlidingWindowRateLimiter(config.lawApiRateLimitPerMin);
  }

  async searchLaws(query: string, requestId = 'system'): Promise<LawSummary[]> {
    const endpoint = 'search';
    const data = await this.callWithRetry(endpoint, `/search?query=${encodeURIComponent(query)}`, requestId);

    const laws = normalizeArray<Record<string, string>>(data?.laws).map((row) => ({
      id: row.id ?? '',
      title: row.title ?? '',
      effective_date: row.effective_date ?? '',
      url: row.url ?? '',
    }));

    return laws.filter((law) => law.id && law.title);
  }

  async getLawArticles(lawId: string, requestId = 'system'): Promise<LawArticle[]> {
    const endpoint = 'articles';
    const data = await this.callWithRetry(endpoint, `/laws/${encodeURIComponent(lawId)}/articles`, requestId);

    const articles = normalizeArray<Record<string, string>>(data?.articles).map((row) => ({
      article_no: row.article_no ?? '',
      text: row.text ?? '',
      effective_date: row.effective_date ?? '',
      url: row.url ?? '',
    }));

    return articles.filter((article) => article.article_no && article.text);
  }

  private async callWithRetry(
    endpoint: 'search' | 'articles',
    path: string,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    this.rateLimiter.consume(endpoint);

    let attempt = 0;
    const maxAttempts = this.config.lawApiRetryCount + 1;
    const startedAt = Date.now();

    while (attempt < maxAttempts) {
      try {
        const result = await this.singleCall(path);
        this.logger.lawApiCall({
          request_id: requestId,
          endpoint,
          latency_ms: Date.now() - startedAt,
          cache_hit: false,
          retry_count: attempt,
          result_count: endpoint === 'search' ? normalizeArray(result.laws).length : normalizeArray(result.articles).length,
        });
        return result;
      } catch (error) {
        const retryable = this.isRetryable(error);
        if (!retryable || attempt >= this.config.lawApiRetryCount) {
          this.logger.lawApiCall({
            request_id: requestId,
            endpoint,
            latency_ms: Date.now() - startedAt,
            cache_hit: false,
            retry_count: attempt,
            result_count: 0,
            error_type: error instanceof Error ? error.name : 'UnknownError',
          });
          throw error;
        }
        attempt += 1;
        await delay(200 * 2 ** (attempt - 1));
      }
    }

    throw new UpstreamError('Unexpected retry flow');
  }

  private async singleCall(path: string): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.lawApiTimeoutMs);

    try {
      const res = await this.fetchImpl(`${this.config.lawApiBaseUrl}${path}`, {
        method: 'GET',
        headers: {
          'X-API-KEY': this.config.lawApiKey,
        },
        signal: controller.signal,
      });

      if (res.status === 429) throw new RateLimitError('Upstream API quota exceeded');
      if (res.status >= 500) throw new UpstreamError('Law API server error', res.status);
      if (!res.ok) throw new UpstreamError('Law API response error', res.status);

      const parsed = (await res.json()) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') {
        throw new UpstreamError('Invalid response payload', res.status);
      }
      return parsed;
    } catch (error) {
      if (error instanceof RateLimitError || error instanceof UpstreamError) throw error;
      if ((error as { name?: string }).name === 'AbortError') {
        throw new TimeoutError();
      }
      throw new UpstreamError('Network error');
    } finally {
      clearTimeout(timeout);
    }
  }

  private isRetryable(error: unknown): boolean {
    return error instanceof TimeoutError || (error instanceof UpstreamError && (!!error.status ? error.status >= 500 : true));
  }
}
