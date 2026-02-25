import { Router } from 'express';
import { ZodError } from 'zod';
import { PetitionService } from '../petition/petitionService';

export function createPetitionRouter(service: PetitionService): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    try {
      const created = await service.create(req.body);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation failed', issues: error.issues });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const data = await service.list({
        limit: req.query.limit as string | undefined,
        offset: req.query.offset as string | undefined
      });
      res.json(data);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation failed', issues: error.issues });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.get('/:id', async (req, res) => {
    const petition = await service.getById(req.params.id);
    if (!petition) {
      return res.status(404).json({ message: 'Petition not found' });
    }
    return res.json(petition);
  });

  router.patch('/:id', async (req, res) => {
    try {
      const petition = await service.update(req.params.id, req.body);
      if (!petition) {
        return res.status(404).json({ message: 'Petition not found' });
      }
      return res.json(petition);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation failed', issues: error.issues });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.delete('/:id', async (req, res) => {
    const deleted = await service.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Petition not found' });
    }
    return res.status(204).send();
  });

  return router;
}
