import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { InMemoryStore } from '../src/store.js';

async function withServer(config, fn, store = new InMemoryStore()) {
  const server = createApp({ config, store });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    await fn(`http://127.0.0.1:${port}`, store);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('BETA_MODE=true이면 과금 체크 없이 /generate 허용', async () => {
  await withServer(
    {
      betaMode: true,
      betaEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      captchaEnabled: false,
      rateLimitPerMinute: 100,
      draftTtlHours: 24,
      storeRawPetition: false
    },
    async (baseUrl, store) => {
      const res = await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-request-id': 'req-1' },
        body: JSON.stringify({ legal_basis: [{ law: 'A' }], audit_risk: { level: 'LOW' } })
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.request_id, 'req-1');
      assert.equal(store.jobs.length, 1);
    }
  );
});

test('BETA_END_DATE 이후 /generate는 503 반환', async () => {
  await withServer(
    {
      betaMode: true,
      betaEndDate: new Date(Date.now() - 1_000),
      captchaEnabled: false,
      rateLimitPerMinute: 100,
      draftTtlHours: 24,
      storeRawPetition: false
    },
    async (baseUrl) => {
      const res = await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({})
      });

      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.message, 'Beta period ended');
    }
  );
});

test('beta-metrics 집계 값 검증', async () => {
  await withServer(
    {
      betaMode: true,
      betaEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      captchaEnabled: false,
      rateLimitPerMinute: 100,
      draftTtlHours: 24,
      storeRawPetition: false
    },
    async (baseUrl) => {
      await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-request-id': 'm-1' },
        body: JSON.stringify({ legal_basis: [{ law: 'A' }], audit_risk: { level: 'HIGH' }, tokens_used: 100 })
      });

      await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-request-id': 'm-2' },
        body: JSON.stringify({ legal_basis: [], audit_risk: { level: 'LOW' }, tokens_used: 50 })
      });

      const res = await fetch(`${baseUrl}/api/admin/beta-metrics`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.total_requests, 2);
      assert.equal(body.high_risk_ratio, 0.5);
      assert.equal(body.failure_rate, 0);
    }
  );
});
