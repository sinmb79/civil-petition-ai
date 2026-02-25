import { Router } from 'express';
import { PetitionService } from '../petition/petitionService';
import { GenerationJobRepository } from '../repository/generationJobRepository';
import { checkBetaGate } from '../http/betaGate';
import { jsonError } from '../http/response';
import {
  incGenerateRequests,
  incJobsCreated,
  incJobsFailed,
  recordProcessingTimeMs
} from '../observability/metrics';

type GenerateRequestBody = {
  petition_id?: string;
};

const RESIDENT_ID_REGEX = /\b\d{6}-?[1-4]\d{6}\b/g;
const PHONE_REGEX = /\b(?:01[0-9]|02|0[3-9][0-9])-?\d{3,4}-?\d{4}\b/g;
const EMAIL_REGEX = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}\b/g;

export function createGenerationRouter(
  petitionService: PetitionService,
  generationJobs: GenerationJobRepository
): Router {
  const router = Router();

  router.post('/generate', async (req, res) => {
    const beta = checkBetaGate();
    if (beta.blocked) {
      return jsonError(res, req, 503, beta.message);
    }

    incGenerateRequests();
    const body = (req.body ?? {}) as GenerateRequestBody;
    if (!body.petition_id) {
      return jsonError(res, req, 400, 'petition_id is required');
    }

    const petition = await petitionService.getById(body.petition_id);
    if (!petition) {
      return jsonError(res, req, 404, 'Petition not found');
    }

    const maskedInputJson = maskPii(
      JSON.stringify({
        petition_id: petition.id,
        raw_text: petition.raw_text,
        processing_type: petition.processing_type,
        budget_related: petition.budget_related,
        discretionary: petition.discretionary
      })
    );
    const ttlHours = resolveTtlHours();
    const job = await generationJobs.createQueued(maskedInputJson, ttlHours);
    incJobsCreated();

    return res.status(202).json({ job_id: job.id, status: job.status });
  });

  router.get('/jobs/:id', async (req, res) => {
    const job = await generationJobs.getById(req.params.id);
    if (!job) {
      return jsonError(res, req, 404, 'Job not found');
    }

    return res.json({
      id: job.id,
      status: job.status,
      result_json: job.result_json,
      error: job.error
    });
  });

  router.post('/worker/claim', async (req, res) => {
    const auth = authorizeWorker(req.header('X-WORKER-TOKEN'));
    if (!auth.ok) {
      return jsonError(res, req, auth.status, auth.message);
    }

    const job = await generationJobs.claimQueued();
    if (!job) {
      return res.status(204).send();
    }

    return res.json({
      id: job.id,
      status: job.status,
      input_masked_json: job.input_masked_json
    });
  });

  router.post('/worker/complete', async (req, res) => {
    const auth = authorizeWorker(req.header('X-WORKER-TOKEN'));
    if (!auth.ok) {
      return jsonError(res, req, auth.status, auth.message);
    }

    const jobId = req.body?.job_id as string | undefined;
    if (!jobId) {
      return jsonError(res, req, 400, 'job_id is required');
    }

    const job = await generationJobs.getById(jobId);
    if (!job) {
      return jsonError(res, req, 404, 'Job not found');
    }

    const completed = await generationJobs.complete(jobId, {
      result_json: req.body?.result_json,
      error: req.body?.error
    });
    if (completed.status === 'FAILED') {
      incJobsFailed();
    }
    if (job.created_at) {
      recordProcessingTimeMs(Date.now() - new Date(job.created_at).getTime());
    }

    return res.json({
      id: completed.id,
      status: completed.status
    });
  });

  return router;
}

function authorizeWorker(tokenHeader: string | undefined): {
  ok: boolean;
  status: number;
  message: string;
} {
  const expected = process.env.WORKER_TOKEN ?? 'dev-worker-token';
  if (!tokenHeader) {
    return { ok: false, status: 401, message: 'Missing worker token' };
  }

  if (tokenHeader !== expected) {
    return { ok: false, status: 403, message: 'Invalid worker token' };
  }

  return { ok: true, status: 200, message: 'ok' };
}

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
