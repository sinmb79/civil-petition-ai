export type CacheMode = 'memory' | 'redis';

export interface AppConfig {
  lawApiBaseUrl: string;
  lawApiKey: string;
  lawApiTimeoutMs: number;
  lawApiRetryCount: number;
  lawApiRateLimitPerMin: number;
  redisUrl?: string;
  legalCacheMode: CacheMode;
}

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): AppConfig => {
  const legalCacheMode = env.LEGAL_CACHE_MODE === 'redis' ? 'redis' : 'memory';

  return {
    lawApiBaseUrl: env.LAW_API_BASE_URL ?? '',
    lawApiKey: env.LAW_API_KEY ?? '',
    lawApiTimeoutMs: toNumber(env.LAW_API_TIMEOUT_MS, 5000),
    lawApiRetryCount: toNumber(env.LAW_API_RETRY_COUNT, 2),
    lawApiRateLimitPerMin: toNumber(env.LAW_API_RATE_LIMIT_PER_MIN, 60),
    redisUrl: env.REDIS_URL,
    legalCacheMode,
  };
};
