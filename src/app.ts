import express from 'express';
import { createPetitionRouter } from './api/petitionRoutes';
import { PetitionService } from './petition/petitionService';

export function createApp(service: PetitionService) {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/petitions', createPetitionRouter(service));

  return app;
}
