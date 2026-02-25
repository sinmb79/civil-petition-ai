import { MemoryLegalCache } from './memoryCache.js';
import { RedisLegalCache } from './redisCache.js';

export const createLegalCache = async (config, deps) => {
  if (config.legalCacheMode !== 'redis') {
    return new MemoryLegalCache();
  }

  if (deps?.redisClient) {
    return new RedisLegalCache(deps.redisClient);
  }

  if (!config.redisUrl) {
    return new MemoryLegalCache();
  }

  const IORedis = (await import('ioredis')).default;
  return new RedisLegalCache(new IORedis(config.redisUrl));
};
