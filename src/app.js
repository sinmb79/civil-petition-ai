import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { HealthService } from './services/health.service.js';
import { MetricsService } from './services/metrics.service.js';
import { RuntimeHealthDependencies } from './services/dependency-checks.js';
import { logger } from './services/logger.js';
import { LogNotificationService } from '../packages/core/notification.js';

function sendJson(res, statusCode, body, requestId) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json');
  if (requestId) res.setHeader('x-request-id', requestId);
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw) return {};
  return JSON.parse(raw);
}

export function createApp(context = {}) {
  const metricsService = context.metricsService ?? new MetricsService();
  const healthService = context.healthService ?? new HealthService(new RuntimeHealthDependencies());
  const appLogger = context.logger ?? logger;
  const notificationService = context.notificationService ?? new LogNotificationService();

  const server = createServer(async (req, res) => {
    const start = process.hrtime.bigint();
    const requestId = req.headers['x-request-id'] || randomUUID();

    try {
      const url = new URL(req.url, 'http://localhost');
      const method = req.method;

      if (method === 'GET' && url.pathname === '/health') {
        const result = await healthService.check();
        return sendJson(res, result.status === 'down' ? 503 : 200, result, requestId);
      }

      if (method === 'GET' && url.pathname === '/metrics') {
        return sendJson(res, 200, metricsService.snapshot(), requestId);
      }

      if (method === 'POST' && url.pathname === '/internal/law-api-call') {
        const body = await readBody(req);
        metricsService.recordLawApiCall(Boolean(body.cacheHit));
        return sendJson(res, 204, {}, requestId);
      }

      if (method === 'POST' && url.pathname === '/internal/draft-failure') {
        metricsService.recordDraftFailure();
        return sendJson(res, 204, {}, requestId);
      }

      if (method === 'POST' && url.pathname === '/internal/audit-risk') {
        const body = await readBody(req);
        const level = body.level;
        if (level === 'HIGH') {
          metricsService.recordAuditRiskHigh();
          appLogger.warn('Audit risk HIGH detected', { request_id: requestId, level, source: 'audit-risk-engine' });
          await notificationService.notify('warn', {
            title: 'Audit risk level HIGH',
            message: 'AuditRiskLevel=HIGH detected. Follow-up review is required.',
            metadata: { request_id: requestId },
            requestId
          });
        }

        return sendJson(res, 200, { status: 'recorded', level }, requestId);
      }

      if (method === 'GET' && url.pathname === '/internal/error') {
        throw new Error('simulated');
      }

      return sendJson(res, 404, {
        error_id: randomUUID(),
        message: 'Resource not found.',
        request_id: requestId
      }, requestId);
    } catch (error) {
      const errorId = randomUUID();
      appLogger.error('Unhandled API error', {
        error_id: errorId,
        request_id: requestId,
        details: error instanceof Error ? error.stack : String(error)
      });

      return sendJson(res, 500, {
        error_id: errorId,
        message: 'Internal server error.',
        request_id: requestId
      }, requestId);
    } finally {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      metricsService.recordRequestDuration(durationMs);
    }
  });

  return { app: server, healthService, metricsService };
}
