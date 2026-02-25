import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { HealthService } from '../src/services/health.service.js';

async function withServer(createContext, run) {
  const { app } = createApp(createContext());
  await new Promise((resolve) => app.listen(0, resolve));
  const { port } = app.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => app.close((err) => (err ? reject(err) : resolve())));
  }
}

function buildHealthService(overrides = {}) {
  const deps = {
    checkDatabase: async () => true,
    checkRedis: async () => 'skip',
    checkExternalLawApi: async () => 'skip',
    ...overrides
  };
  return new HealthService(deps);
}

test('GET /health returns ok in healthy state', async () => {
  await withServer(
    () => ({
      healthService: buildHealthService({
        checkDatabase: async () => true,
        checkRedis: async () => true,
        checkExternalLawApi: async () => 'ok'
      })
    }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.status, 'ok');
      assert.deepEqual(body.checks, { database: 'ok', redis: 'ok', external_law_api: 'ok' });
    }
  );
});

test('GET /health returns down when DB check fails', async () => {
  await withServer(
    () => ({ healthService: buildHealthService({ checkDatabase: async () => false }) }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);
      const body = await response.json();

      assert.equal(response.status, 503);
      assert.equal(body.status, 'down');
      assert.equal(body.checks.database, 'fail');
    }
  );
});

test('HIGH audit risk emits warn log', async () => {
  const warned = [];
  await withServer(
    () => ({
      logger: {
        info() {},
        warn(message, payload) {
          warned.push({ message, payload });
        },
        error() {}
      },
      notificationService: { notify: async () => {} }
    }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/internal/audit-risk`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ level: 'HIGH' })
      });
      assert.equal(response.status, 200);
      assert.equal(warned.length, 1);
      assert.match(warned[0].message, /HIGH/);
    }
  );
});

test('GET /metrics shows metric increments', async () => {
  await withServer(
    () => ({}),
    async (baseUrl) => {
      await fetch(`${baseUrl}/internal/law-api-call`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cacheHit: true })
      });
      await fetch(`${baseUrl}/internal/law-api-call`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cacheHit: false })
      });
      await fetch(`${baseUrl}/internal/draft-failure`, { method: 'POST' });
      await fetch(`${baseUrl}/internal/audit-risk`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ level: 'HIGH' })
      });

      const response = await fetch(`${baseUrl}/metrics`);
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.law_api_calls, 2);
      assert.equal(body.law_api_cache_hits, 1);
      assert.equal(body.law_api_cache_hit_rate, 0.5);
      assert.equal(body.audit_risk_high_count, 1);
      assert.equal(body.draft_generation_failures, 1);
      assert.ok(body.request_count >= 4);
    }
  );
});

test('500 errors return standardized payload', async () => {
  await withServer(
    () => ({ logger: { info() {}, warn() {}, error() {} } }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/internal/error`);
      const body = await response.json();
      assert.equal(response.status, 500);
      assert.equal(body.message, 'Internal server error.');
      assert.equal(typeof body.error_id, 'string');
      assert.equal(typeof body.request_id, 'string');
    }
  );
});
