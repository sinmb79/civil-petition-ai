import request from 'supertest';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createApp } from '../../src/app';
import { PetitionService } from '../../src/petition/petitionService';
import { PrismaPetitionRepository } from '../../src/repository/prismaPetitionRepository';

const dbFile = path.join(process.cwd(), `.tmp-test-${randomUUID()}.db`);

let prisma: any;
let app: ReturnType<typeof createApp>;

describe('Petition routes integration', () => {
  let createdId: string;

  beforeAll(async () => {
    const databaseUrl = `file:${dbFile}`;
    process.env.DATABASE_URL = databaseUrl;
    const commandEnv = { ...process.env, DATABASE_URL: databaseUrl };

    execSync('pnpm prisma:generate:test', { stdio: 'inherit', env: commandEnv });
    execSync('pnpm db:push:test', { stdio: 'inherit', env: commandEnv });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('../../src/generated/prisma-test');
    prisma = new PrismaClient();

    const service = new PetitionService(new PrismaPetitionRepository(prisma));
    app = createApp(service);
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

  it('POST /api/petitions/:id/generate-draft returns structured draft payload', async () => {
    const response = await request(app).post(`/api/petitions/${createdId}/generate-draft`).send({});

    expect(response.status).toBe(200);
    expect(response.body.petition_id).toBe(createdId);
    expect(response.body.decision).toBe('REQUEST_INFO');
    expect(response.body.legal_review).toContain('Insufficient Legal Basis');
    expect(response.body).toHaveProperty('petition_summary');
    expect(response.body).toHaveProperty('fact_analysis');
    expect(response.body).toHaveProperty('action_plan');
    expect(response.body).toHaveProperty('legal_basis');
    expect(Array.isArray(response.body.legal_basis)).toBe(true);
    expect(response.body).toHaveProperty('audit_risk');
    expect(response.body.audit_risk).toHaveProperty('level');
    expect(response.body.audit_risk).toHaveProperty('findings');
    expect(response.body.audit_risk).toHaveProperty('recommendations');
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
