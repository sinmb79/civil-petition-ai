import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { AppLogger, LegalApiAdapter } from '../src/types.js';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civil-petition-test-'));
const dbPath = path.join(tempDir, 'test.db');
const databaseUrl = `file:${dbPath}`;

beforeAll(() => {
  execSync('pnpm prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });
});

afterAll(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('POST /api/petitions/:id/generate-draft', () => {
  it('persists draft reply and logs request id', async () => {
    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();

    const petition = await prisma.petition.create({
      data: {
        rawText: 'Resident requests sidewalk maintenance near the school.',
        processingType: 'STANDARD',
        budgetRelated: true,
        discretionary: false,
      },
    });

    const legalAdapter: LegalApiAdapter = {
      async retrieveForPetition() {
        return [
          {
            sourceType: 'STATUTE',
            title: 'Local Road Maintenance Act',
            article: 'Article 12',
            effectiveDate: '2024-01-01',
            sourceUrl: 'https://example.gov/law/road-12',
            content: 'Municipality shall maintain pedestrian safety.',
          },
        ];
      },
    };

    const logger: AppLogger = {
      info: vi.fn(),
      error: vi.fn(),
    };

    const app = createApp({ prisma, legalAdapter, logger });

    const response = await app.inject({
      method: 'POST',
      url: `/api/petitions/${petition.id}/generate-draft`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.petition_summary).toContain('Resident requests sidewalk maintenance');
    expect(body.legal_basis).toHaveLength(1);

    const persistedDraft = await prisma.draftReply.findFirst({ where: { petitionId: petition.id } });
    expect(persistedDraft).not.toBeNull();

    expect(logger.info).toHaveBeenCalledOnce();
    const [payload] = vi.mocked(logger.info).mock.calls[0];
    expect(payload).toMatchObject({
      petition_id: petition.id,
      decision: body.decision,
      audit_risk_level: body.audit_risk.level,
      number_of_sources: 1,
    });
    expect((payload as Record<string, string>).request_id).toBeTypeOf('string');

    await app.close();
    await prisma.$disconnect();
  });

  it('returns 422 when citation data is incomplete', async () => {
    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();

    const petition = await prisma.petition.create({
      data: {
        rawText: 'Need permit review.',
        processingType: 'STANDARD',
      },
    });

    const legalAdapter: LegalApiAdapter = {
      async retrieveForPetition() {
        return [
          {
            sourceType: 'STATUTE',
            title: 'Permit Act',
            article: '',
            effectiveDate: '2024-01-01',
            sourceUrl: 'https://example.gov/permit',
            content: '...',
          },
        ];
      },
    };

    const app = createApp({ prisma, legalAdapter, logger: { info: vi.fn(), error: vi.fn() } });

    const response = await app.inject({
      method: 'POST',
      url: `/api/petitions/${petition.id}/generate-draft`,
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().details[0]).toContain('article is required');

    await app.close();
    await prisma.$disconnect();
  });
});
