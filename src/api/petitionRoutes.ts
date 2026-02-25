import { Router } from 'express';
import { ZodError } from 'zod';
import { PetitionService } from '../petition/petitionService';
import { LegalSource } from '../../packages/draft-engine/src';
import { GenerationJobRepository } from '../repository/generationJobRepository';
import { jsonError } from '../http/response';
import { checkBetaGate } from '../http/betaGate';
import { generateDraftPayloadFromPetition } from '../services/draftGenerationService';
import { incGenerateRequests, incJobsCreated } from '../observability/metrics';

export function createPetitionRouter(
  service: PetitionService,
  options?: { generationJobs?: GenerationJobRepository }
): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    try {
      const created = await service.create(req.body);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        return jsonError(res, req, 400, 'Validation failed');
      }
      return jsonError(res, req, 500, 'Internal server error');
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
        return jsonError(res, req, 400, 'Validation failed');
      }
      return jsonError(res, req, 500, 'Internal server error');
    }
  });

  router.get('/:id', async (req, res) => {
    const petition = await service.getById(req.params.id);
    if (!petition) {
      return jsonError(res, req, 404, 'Petition not found');
    }
    return res.json(petition);
  });

  router.patch('/:id', async (req, res) => {
    try {
      const petition = await service.update(req.params.id, req.body);
      if (!petition) {
        return jsonError(res, req, 404, 'Petition not found');
      }
      return res.json(petition);
    } catch (error) {
      if (error instanceof ZodError) {
        return jsonError(res, req, 400, 'Validation failed');
      }
      return jsonError(res, req, 500, 'Internal server error');
    }
  });

  router.delete('/:id', async (req, res) => {
    const deleted = await service.delete(req.params.id);
    if (!deleted) {
      return jsonError(res, req, 404, 'Petition not found');
    }
    return res.status(204).send();
  });

  router.post('/:id/generate-draft', async (req, res) => {
    const beta = checkBetaGate();
    if (beta.blocked) {
      return jsonError(res, req, 503, beta.message);
    }
    incGenerateRequests();

    const petition = await service.getById(req.params.id);
    if (!petition) {
      return jsonError(res, req, 404, 'Petition not found');
    }

    const mode = (process.env.GENERATION_MODE ?? 'async').toLowerCase();
    if (mode === 'async') {
      if (!options?.generationJobs) {
        return jsonError(res, req, 500, 'Generation job repository is not configured');
      }

      const maskedInputJson = JSON.stringify({
        petition_id: petition.id,
        raw_text: maskPii(petition.raw_text),
        processing_type: petition.processing_type,
        budget_related: petition.budget_related,
        discretionary: petition.discretionary
      });
      const ttlHours = resolveTtlHours();
      const job = await options.generationJobs.createQueued(maskedInputJson, ttlHours);
      incJobsCreated();
      return res.status(202).json({
        message: 'Deprecated sync endpoint. Job queued for async generation.',
        job_id: job.id,
        status: job.status
      });
    }

    const legalSources = collectLegalSources(req.body?.legal_sources as unknown);

    try {
      const payload = await generateDraftPayloadFromPetition({
        petition_id: petition.id,
        raw_text: petition.raw_text,
        processing_type: petition.processing_type,
        budget_related: petition.budget_related,
        discretionary: petition.discretionary,
        legal_sources: legalSources
      });
      return res.status(200).json(payload);
    } catch (error) {
      if (error instanceof ZodError) {
        return jsonError(res, req, 400, 'Validation failed');
      }
      return jsonError(res, req, 500, 'Draft generation failed');
    }
  });

  return router;
}

function collectLegalSources(input: unknown): LegalSource[] {
  if (Array.isArray(input)) {
    return input.filter(isLegalSource);
  }

  // Placeholder for legal retrieval integration. Empty list triggers REQUEST_INFO fallback.
  return [];
}

function isLegalSource(value: unknown): value is LegalSource {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const source = value as LegalSource;
  return (
    typeof source.law_name === 'string' &&
    typeof source.article_number === 'string' &&
    typeof source.effective_date === 'string' &&
    typeof source.source_link === 'string'
  );
}

const RESIDENT_ID_REGEX = /\b\d{6}-?[1-4]\d{6}\b/g;
const PHONE_REGEX = /\b(?:01[0-9]|02|0[3-9][0-9])-?\d{3,4}-?\d{4}\b/g;
const EMAIL_REGEX = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}\b/g;

function maskPii(value: string): string {
  return value
    .replace(RESIDENT_ID_REGEX, '[REDACTED_RESIDENT_ID]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]')
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
}

function resolveTtlHours(): number {
  const ttlHours = Number(process.env.DRAFT_TTL_HOURS ?? 24);
  if (!Number.isFinite(ttlHours) || ttlHours <= 0) {
    return 24;
  }

  return Math.floor(ttlHours);
}
