export class HealthService {
  constructor(deps) {
    this.deps = deps;
  }

  async check() {
    const databaseOk = await this.deps.checkDatabase();
    const redisState = await this.deps.checkRedis();
    const externalLawApi = await this.deps.checkExternalLawApi();

    const checks = {
      database: databaseOk ? 'ok' : 'fail',
      redis: redisState === 'skip' ? 'skip' : redisState ? 'ok' : 'fail',
      external_law_api: externalLawApi
    };

    const status = checks.database === 'fail' ? 'down' : checks.redis === 'fail' ? 'degraded' : 'ok';

    return { status, checks, timestamp: new Date().toISOString() };
  }
}
