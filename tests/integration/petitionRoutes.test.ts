import request from 'supertest';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createApp } from '../../src/app';
import { PetitionService } from '../../src/petition/petitionService';
import { GenerationJobRepository } from '../../src/repository/generationJobRepository';
import { PrismaPetitionRepository } from '../../src/repository/prismaPetitionRepository';

const dbFile = path.join(process.cwd(), `.tmp-test-${randomUUID()}.db`);

let prisma: any;
let app: ReturnType<typeof createApp>;

describe('Petition routes integration', () => {
  let createdId: string;
  const workerToken = 'test-worker-token';

  beforeAll(async () => {
    const databaseUrl = `file:${dbFile}`;
    process.env.DATABASE_URL = databaseUrl;
    process.env.GENERATION_MODE = 'async';
    process.env.WORKER_TOKEN = workerToken;
    const commandEnv = { ...process.env, DATABASE_URL: databaseUrl };

    const prismaTestClientPath = path.join(process.cwd(), 'src', 'generated', 'prisma-test', 'index.js');
    if (!fs.existsSync(prismaTestClientPath)) {
      execSync('pnpm prisma:generate:test', { stdio: 'inherit', env: commandEnv });
    }
    execSync('pnpm db:push:test', { stdio: 'inherit', env: commandEnv });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('../../src/generated/prisma-test');
    prisma = new PrismaClient();

    const service = new PetitionService(new PrismaPetitionRepository(prisma));
    const generationJobs = new GenerationJobRepository(prisma);
    app = createApp(service, { generationJobs, prisma });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  });

  it('POST /api/petitions creates a petition', async () => {
    const response = await request(app).post('/api/petitions').send({
      raw_text: 'This petition has enough length to be valid.',
      processing_type: 'GENERAL',
      budget_related: true,
      discretionary: false
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    createdId = response.body.id;
  });

  it('GET /api/petitions returns paginated list', async () => {
    const response = await request(app).get('/api/petitions?limit=10&offset=0');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThan(0);
  });

  it('GET /api/petitions/:id reads one petition', async () => {
    const response = await request(app).get(`/api/petitions/${createdId}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdId);
  });

  it('PATCH /api/petitions/:id updates petition partially', async () => {
    const response = await request(app)
      .patch(`/api/petitions/${createdId}`)
      .send({ processing_type: 'URGENT' });

    expect(response.status).toBe(200);
    expect(response.body.processing_type).toBe('URGENT');
  });

  it('GET /health returns health details', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('ok');
    expect(response.body).toHaveProperty('db');
    expect(response.body).toHaveProperty('prisma');
    expect(response.body).toHaveProperty('worker_token_configured');
  });

  it('POST /api/petitions/:id/generate-draft returns structured draft payload', async () => {
    const response = await request(app).post(`/api/petitions/${createdId}/generate-draft`).send({});

    expect(response.status).toBe(202);
    expect(response.body).toHaveProperty('job_id');
    expect(response.body.status).toBe('QUEUED');
  });

  it('supports async job flow: create -> claim -> complete -> get', async () => {
    const generated = await request(app).post('/api/generate').send({ petition_id: createdId });
    expect(generated.status).toBe(202);
    expect(generated.body).toHaveProperty('job_id');

    let claim: request.Response | null = null;
    for (let i = 0; i < 5; i += 1) {
      const claimed = await request(app)
        .post('/api/worker/claim')
        .set('X-WORKER-TOKEN', workerToken)
        .send({});
      if (claimed.status === 204) {
        break;
      }
      expect(claimed.status).toBe(200);
      expect(claimed.body.status).toBe('RUNNING');
      if (claimed.body.id === generated.body.job_id) {
        claim = claimed;
        break;
      }

      await request(app)
        .post('/api/worker/complete')
        .set('X-WORKER-TOKEN', workerToken)
        .send({ job_id: claimed.body.id, result_json: '{"drained":true}' });
    }

    expect(claim).not.toBeNull();

    const resultPayload = JSON.stringify({ decision: 'REQUEST_INFO', note: 'done' });
    const completed = await request(app)
      .post('/api/worker/complete')
      .set('X-WORKER-TOKEN', workerToken)
      .send({ job_id: generated.body.job_id, result_json: resultPayload });
    expect(completed.status).toBe(200);
    expect(completed.body.status).toBe('DONE');

    const fetched = await request(app).get(`/api/jobs/${generated.body.job_id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.status).toBe('DONE');
    expect(fetched.body.result_json).toBe(resultPayload);
  });

  it('returns 503 when beta period is ended', async () => {
    process.env.BETA_MODE = 'true';
    process.env.BETA_END_DATE = '2000-01-01T00:00:00.000Z';

    const response = await request(app).post('/api/generate').send({ petition_id: createdId });
    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('error_id');
    expect(response.body).toHaveProperty('request_id');
    expect(response.body.message).toContain('Beta period ended');

    process.env.BETA_MODE = 'false';
    delete process.env.BETA_END_DATE;
  });

  it('rejects worker endpoints without valid token', async () => {
    const missing = await request(app).post('/api/worker/claim').send({});
    expect(missing.status).toBe(401);

    const invalid = await request(app)
      .post('/api/worker/complete')
      .set('X-WORKER-TOKEN', 'wrong-token')
      .send({ job_id: 'x', result_json: '{}' });
    expect(invalid.status).toBe(403);
  });

  it('DELETE /api/petitions/:id deletes petition', async () => {
    const response = await request(app).delete(`/api/petitions/${createdId}`);
    expect(response.status).toBe(204);

    const deletedRead = await request(app).get(`/api/petitions/${createdId}`);
    expect(deletedRead.status).toBe(404);
  });

  it('returns 400 on invalid payload', async () => {
    const response = await request(app).post('/api/petitions').send({
      raw_text: 'short',
      processing_type: ''
    });

    expect(response.status).toBe(400);
  });
});
