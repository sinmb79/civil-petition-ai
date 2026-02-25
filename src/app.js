import http from 'node:http';
import crypto from 'node:crypto';
import { getConfig } from './config.js';
import { InMemoryStore } from './store.js';
import { hasEntitlement } from './services/entitlement.js';
import { isBetaActive, isBetaEnded } from './services/beta.js';

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function getIp(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        return resolve(JSON.parse(raw));
      } catch {
        return resolve({});
      }
    });
  });
}

export function createApp(options = {}) {
  const config = options.config || getConfig();
  const store = options.store || new InMemoryStore();
  const rate = new Map();

  const server = http.createServer(async (req, res) => {
    const now = Date.now();
    const ip = getIp(req);
    const rateEntry = rate.get(ip) || { count: 0, windowStart: now };

    if (now - rateEntry.windowStart >= 60_000) {
      rateEntry.count = 0;
      rateEntry.windowStart = now;
    }

    rateEntry.count += 1;
    rate.set(ip, rateEntry);

    if (rateEntry.count > config.rateLimitPerMinute) {
      return sendJson(res, 429, { message: 'Rate limit exceeded' });
    }

    if (req.method === 'POST' && req.url === '/generate') {
      const body = await readBody(req);
      const requestId = req.headers['x-request-id'] || crypto.randomUUID();
      const startedAt = Date.now();

      if (config.captchaEnabled) {
        const token = req.headers['x-turnstile-token'] || body.captchaToken;
        if (token !== 'valid-test-token') {
          return sendJson(res, 403, { message: 'Captcha verification failed' });
        }
      }

      if (isBetaEnded(config)) {
        return sendJson(res, 503, { message: 'Beta period ended' });
      }

      const betaActive = isBetaActive(config);
      if (!betaActive && !hasEntitlement(req)) {
        return sendJson(res, 402, { message: 'Insufficient credits' });
      }

      try {
        const legalBasis = Array.isArray(body.legal_basis) ? body.legal_basis : [];
        const auditRisk = body.audit_risk?.level || 'LOW';
        const processingTime = Date.now() - startedAt;

        store.addDraft(
          {
            request_id: requestId,
            result: body.result || {},
            petition_text: config.storeRawPetition ? body.petition_text : undefined
          },
          config.draftTtlHours
        );

        const job = {
          request_id: requestId,
          processing_time_ms: processingTime,
          tokens_used: body.tokens_used ?? null,
          audit_risk_level: auditRisk,
          number_of_legal_sources: legalBasis.length,
          error_flag: false
        };
        store.addJob(job);
        console.log('[generation_job_completed]', job);
        return sendJson(res, 200, { request_id: requestId, status: 'ok', beta_mode: betaActive });
      } catch (error) {
        const processingTime = Date.now() - startedAt;
        const job = {
          request_id: requestId,
          processing_time_ms: processingTime,
          tokens_used: body.tokens_used ?? null,
          audit_risk_level: body.audit_risk?.level || 'LOW',
          number_of_legal_sources: Array.isArray(body.legal_basis) ? body.legal_basis.length : 0,
          error_flag: true
        };
        store.addJob(job);
        console.error('[generation_job_failed]', error);
        return sendJson(res, 500, { message: 'Generation failed' });
      }
    }

    if (req.method === 'POST' && req.url === '/api/stripe/checkout') {
      if (config.betaMode) {
        return sendJson(res, 200, { message: 'Billing is disabled during beta period.' });
      }
      return sendJson(res, 501, { message: 'Stripe checkout not implemented' });
    }

    if (req.method === 'POST' && req.url === '/api/stripe/webhook') {
      if (config.betaMode) {
        return sendJson(res, 200, { message: 'Billing webhook ignored during beta period.' });
      }
      return sendJson(res, 501, { message: 'Stripe webhook not implemented' });
    }

    if (req.method === 'GET' && req.url === '/api/admin/beta-metrics') {
      return sendJson(res, 200, store.getDailyMetrics());
    }

    return sendJson(res, 404, { message: 'Not found' });
  });

  server.locals = { config, store };
  return server;
}
