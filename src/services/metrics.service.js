export class MetricsService {
  #requestCount = 0;
  #totalRequestDurationMs = 0;
  #lawApiCalls = 0;
  #lawApiCacheHits = 0;
  #auditRiskHighCount = 0;
  #draftGenerationFailures = 0;

  recordRequestDuration(durationMs) {
    this.#requestCount += 1;
    this.#totalRequestDurationMs += durationMs;
  }

  recordLawApiCall(cacheHit) {
    this.#lawApiCalls += 1;
    if (cacheHit) this.#lawApiCacheHits += 1;
  }

  recordAuditRiskHigh() {
    this.#auditRiskHighCount += 1;
  }

  recordDraftFailure() {
    this.#draftGenerationFailures += 1;
  }

  snapshot() {
    return {
      request_count: this.#requestCount,
      avg_request_duration_ms: this.#requestCount === 0 ? 0 : Number((this.#totalRequestDurationMs / this.#requestCount).toFixed(2)),
      law_api_calls: this.#lawApiCalls,
      law_api_cache_hits: this.#lawApiCacheHits,
      law_api_cache_hit_rate: this.#lawApiCalls === 0 ? 0 : Number((this.#lawApiCacheHits / this.#lawApiCalls).toFixed(4)),
      audit_risk_high_count: this.#auditRiskHighCount,
      draft_generation_failures: this.#draftGenerationFailures
    };
  }
}
