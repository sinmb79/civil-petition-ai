import Fastify from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { registerGenerateDraftRoute } from './routes/generateDraftRoute.js';
import type { AppLogger, LegalApiAdapter } from './types.js';

export function createApp(deps: { prisma: PrismaClient; legalAdapter: LegalApiAdapter; logger: AppLogger }) {
  const app = Fastify();
  void registerGenerateDraftRoute(app, deps);
  return app;
}
