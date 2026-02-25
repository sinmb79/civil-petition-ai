import { generateDraftPayloadFromPetition } from '../src/services/draftGenerationService';

type ClaimedJob = {
  id: string;
  status: string;
  input_masked_json: string;
};

async function main(): Promise<void> {
  const baseUrl = process.env.WORKER_API_BASE_URL ?? 'http://127.0.0.1:3000';
  const workerToken = process.env.WORKER_TOKEN;
  if (!workerToken) {
    throw new Error('WORKER_TOKEN is required');
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const claimed = await claimJob(baseUrl, workerToken);
    if (!claimed) {
      await sleep(randomInt(1000, 3000));
      continue;
    }

    try {
      const parsed = JSON.parse(claimed.input_masked_json) as {
        petition_id: string;
        raw_text: string;
        processing_type: string;
        budget_related: boolean;
        discretionary: boolean;
      };
      const result = await generateDraftPayloadFromPetition({
        petition_id: parsed.petition_id,
        raw_text: parsed.raw_text,
        processing_type: parsed.processing_type,
        budget_related: parsed.budget_related,
        discretionary: parsed.discretionary,
        legal_sources: []
      });
      await completeJob(baseUrl, workerToken, claimed.id, {
        result_json: JSON.stringify(result)
      });
    } catch (error) {
      await completeJob(baseUrl, workerToken, claimed.id, {
        error: String((error as Error)?.message ?? error)
      });
    }
  }
}

async function claimJob(baseUrl: string, workerToken: string): Promise<ClaimedJob | null> {
  const response = await fetch(`${baseUrl}/api/worker/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WORKER-TOKEN': workerToken
    },
    body: '{}'
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`claim failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as ClaimedJob;
}

async function completeJob(
  baseUrl: string,
  workerToken: string,
  jobId: string,
  payload: { result_json?: string; error?: string }
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/worker/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WORKER-TOKEN': workerToken
    },
    body: JSON.stringify({ job_id: jobId, ...payload })
  });

  if (!response.ok) {
    throw new Error(`complete failed: ${response.status} ${response.statusText}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: 'worker.fatal',
      message: String((error as Error)?.message ?? error),
      timestamp: new Date().toISOString()
    })
  );
  process.exit(1);
});
