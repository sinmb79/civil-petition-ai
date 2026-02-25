import { SlidingWindowRateLimiter } from './rateLimiter.js';
import { RateLimitError, TimeoutError, UpstreamError } from './errors.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

export class LawApiClient {
  constructor(config, logger, deps) {
    this.config = config;
    this.logger = logger;
    this.fetchImpl = deps?.fetchImpl ?? fetch;
    this.rateLimiter = deps?.rateLimiter ?? new SlidingWindowRateLimiter(config.lawApiRateLimitPerMin);
  }

  async searchLaws(query, requestId = 'system') {
    const data = await this.callWithRetry('search', `/search?query=${encodeURIComponent(query)}`, requestId);
    const laws = normalizeArray(data?.laws).map((row) => ({
      id: row.id ?? '',
      title: row.title ?? '',
      effective_date: row.effective_date ?? '',
      url: row.url ?? '',
    }));
    return laws.filter((law) => law.id && law.title);
  }

  async getLawArticles(lawId, requestId = 'system') {
    const data = await this.callWithRetry('articles', `/laws/${encodeURIComponent(lawId)}/articles`, requestId);
    const articles = normalizeArray(data?.articles).map((row) => ({
      article_no: row.article_no ?? '',
      text: row.text ?? '',
      effective_date: row.effective_date ?? '',
      url: row.url ?? '',
    }));
    return articles.filter((article) => article.article_no && article.text);
  }

  async callWithRetry(endpoint, path, requestId) {
    this.rateLimiter.consume(endpoint);

    let attempt = 0;
    const startedAt = Date.now();

    while (attempt <= this.config.lawApiRetryCount) {
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

  async singleCall(path) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.lawApiTimeoutMs);

    try {
      const res = await this.fetchImpl(`${this.config.lawApiBaseUrl}${path}`, {
        method: 'GET',
        headers: { 'X-API-KEY': this.config.lawApiKey },
        signal: controller.signal,
      });
      if (res.status === 429) throw new RateLimitError('Upstream API quota exceeded');
      if (res.status >= 500) throw new UpstreamError('Law API server error', res.status);
      if (!res.ok) throw new UpstreamError('Law API response error', res.status);
      const parsed = await res.json();
      if (!parsed || typeof parsed !== 'object') throw new UpstreamError('Invalid response payload', res.status);
      return parsed;
    } catch (error) {
      if (error instanceof RateLimitError || error instanceof UpstreamError) throw error;
      if (error?.name === 'AbortError') throw new TimeoutError();
      throw new UpstreamError('Network error');
    } finally {
      clearTimeout(timeout);
    }
  }

  isRetryable(error) {
    return error instanceof TimeoutError || (error instanceof UpstreamError && (error.status ? error.status >= 500 : true));
  }
}
