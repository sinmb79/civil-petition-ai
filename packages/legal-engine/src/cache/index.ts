import { AppConfig } from '../../../core/config.js';
import { MemoryLegalCache } from './memoryCache.js';
import { RedisLegalCache, RedisLike } from './redisCache.js';
import { ILegalCache } from './types.js';

export const createLegalCache = async (
  config: AppConfig,
  deps?: { redisClient?: RedisLike },
): Promise<ILegalCache> => {
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
  return new RedisLegalCache(new IORedis(config.redisUrl) as RedisLike);
};
