# Civil Petition AI

Backend foundation for the Civil Petition Decision Support System.

## Tech Stack

- Node.js + TypeScript
- Express API
- Prisma ORM
- PostgreSQL (primary runtime database)
- Jest + Supertest (unit + integration tests)

## Petition CRUD API

- `POST /api/petitions`
- `GET /api/petitions?limit=20&offset=0`
- `GET /api/petitions/:id`
- `PATCH /api/petitions/:id`
- `DELETE /api/petitions/:id`

Validation rules:
- `raw_text`: required, min length 10
- `processing_type`: required

## Database setup (PostgreSQL)

1. Create `.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/civil_petition_ai?schema=public"
```

2. Install dependencies:

```bash
pnpm install
```

3. Generate Prisma client:

```bash
pnpm prisma:generate
```

4. Apply migrations:

```bash
pnpm prisma:migrate
```

5. Run seed scaffold (no data insertion):

```bash
pnpm prisma:seed
```

## Run service

```bash
pnpm dev
```

## Runtime env (beta + async jobs)

- `GENERATION_MODE=async|sync` (default: `async`)
- `BETA_MODE=true|false` (default: `false`)
- `BETA_END_DATE=ISO-8601` (example: `2026-12-31T23:59:59Z`)
- `WORKER_TOKEN=<secret token>`
- `DRAFT_TTL_HOURS=24`

When `BETA_MODE=true` and current time is after `BETA_END_DATE`, `/api/generate` and `/api/petitions/:id/generate-draft` return `503`.

## Async draft flow

1. Create job:
   - `POST /api/generate` with `{ "petition_id": "<id>" }`
2. Poll result:
   - `GET /api/jobs/:job_id`
3. Worker claims/completes:
   - `POST /api/worker/claim`
   - `POST /api/worker/complete`

## Worker execution

```bash
WORKER_TOKEN=dev-worker-token WORKER_API_BASE_URL=http://127.0.0.1:3000 pnpm worker:start
```

This script is OpenClaw-compatible in interface and can be replaced by platform-managed workers later.
Detailed integration runbook: `OPENCLAW_PLAYBOOK.md`.

## Cleanup expired jobs

```bash
pnpm cleanup:jobs
```

## Testing

```bash
pnpm test
```

Integration tests use an isolated SQLite database through `database/schema.test.prisma` so tests run without requiring a local PostgreSQL instance.
