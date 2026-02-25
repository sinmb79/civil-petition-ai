import express from 'express';
import { PetitionService } from './petition-service.js';

export function createApp(petitionService: PetitionService) {
  const app = express();
  app.use(express.json());

  app.get('/api/petitions/:id/similar', async (req, res) => {
    const id = req.params.id;
    const petition = petitionService.getPetition(id);
    if (!petition) {
      res.status(404).json({ message: 'Petition not found' });
      return;
    }

    const topK = Number(req.query.topK ?? '5');
    const safeTopK = Number.isFinite(topK) && topK > 0 ? Math.floor(topK) : 5;
    const similar = await petitionService.findSimilarPetitions(id, safeTopK);

    res.json({
      petition_id: id,
      count: similar.length,
      results: similar,
    });
  });

  return app;
}
