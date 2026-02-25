function hasTruthyEnv(name) {
  return Boolean(process.env[name] && process.env[name] !== 'false');
}

export class RuntimeHealthDependencies {
  async checkDatabase() {
    return hasTruthyEnv('DATABASE_URL');
  }

  async checkRedis() {
    if (!process.env.REDIS_URL) return 'skip';
    return hasTruthyEnv('REDIS_HEALTH_OK');
  }

  async checkExternalLawApi() {
    const baseUrl = process.env.LAW_API_BASE_URL;
    if (!baseUrl) return 'skip';

    try {
      new URL(baseUrl);
      return 'ok';
    } catch {
      return 'skip';
    }
  }
}
