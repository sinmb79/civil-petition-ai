import express from 'express';
import { createPetitionRouter } from './api/petitionRoutes';
import { createGenerationRouter } from './api/generationRoutes';
import { PetitionService } from './petition/petitionService';
import { GenerationJobRepository } from './repository/generationJobRepository';
import { assignRequestId } from './http/response';
import { getMetricsSnapshot } from './observability/metrics';
import { renderHomepage } from './web/homepage';

export function createApp(
  service: PetitionService,
  options?: {
    generationJobs?: GenerationJobRepository;
    prisma?: { $queryRawUnsafe?: (query: string) => Promise<unknown> };
  }
) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    assignRequestId(req);
    next();
  });
  app.get('/', (_req, res) => {
    res.type('html').send(renderHomepage());
  });

  app.get('/health', async (_req, res) => {
    let db = 'unknown';
    try {
      if (options?.prisma?.$queryRawUnsafe) {
        await options.prisma.$queryRawUnsafe('SELECT 1');
        db = 'up';
      } else {
        db = 'not_configured';
      }
    } catch {
      db = 'down';
    }

    res.json({
      ok: db !== 'down',
      db,
      prisma: Boolean(options?.prisma),
      worker_token_configured: Boolean(process.env.WORKER_TOKEN)
    });
  });
  app.get('/metrics', (_req, res) => {
    res.json(getMetricsSnapshot());
  });

  app.use('/api/petitions', createPetitionRouter(service, options));
  if (options?.generationJobs) {
    app.use('/api', createGenerationRouter(service, options.generationJobs));
  }

  return app;
}
