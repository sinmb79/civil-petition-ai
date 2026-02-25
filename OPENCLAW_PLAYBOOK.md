# OPENCLAW Playbook

Operational playbook for integrating OpenClaw workers with `civil-petition-ai`.

## 1. Objective

Use OpenClaw-managed workers to process asynchronous draft generation jobs through the API contract already provided by this service.

Primary goals:
- deterministic job lifecycle (`QUEUED -> PROCESSING -> COMPLETED|FAILED`)
- traceable processing with request/job IDs
- secure worker authentication with `WORKER_TOKEN`

## 2. Integration Surface

OpenClaw worker runtime should call:
- `POST /api/worker/claim`
- `POST /api/worker/complete`

Client-facing async APIs:
- `POST /api/generate`
- `GET /api/jobs/:id`

Health/ops endpoints:
- `GET /health`
- `GET /metrics`

## 3. Required Environment Variables

API service:
- `DATABASE_URL`
- `WORKER_TOKEN`
- `GENERATION_MODE=async|sync` (default: `async`)
- `DRAFT_TTL_HOURS` (default: `24`)
- `BETA_MODE=true|false` (default: `false`)
- `BETA_END_DATE=<ISO-8601>`

Worker process:
- `WORKER_TOKEN` (must match API service)
- `WORKER_API_BASE_URL` (example: `http://127.0.0.1:3000`)

## 4. Local Runbook

1. Install and generate Prisma client:
```bash
pnpm install
pnpm prisma:generate
```

2. Start API server:
```bash
WORKER_TOKEN=dev-worker-token pnpm dev
```

3. Start worker (local script, OpenClaw-compatible API contract):
```bash
WORKER_TOKEN=dev-worker-token WORKER_API_BASE_URL=http://127.0.0.1:3000 pnpm worker:start
```

4. Enqueue job:
```bash
curl -X POST http://127.0.0.1:3000/api/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"petition_id\":\"<petition-id>\"}"
```

5. Poll job:
```bash
curl http://127.0.0.1:3000/api/jobs/<job-id>
```

## 5. Worker Contract

`POST /api/worker/claim`
- Headers: `X-WORKER-TOKEN: <WORKER_TOKEN>`
- 204 when no job is available
- 200 response:
```json
{
  "id": "job_id",
  "status": "PROCESSING",
  "input_masked_json": "{...}"
}
```

`POST /api/worker/complete`
- Headers: `X-WORKER-TOKEN: <WORKER_TOKEN>`
- Body:
```json
{
  "job_id": "job_id",
  "result_json": "{\"...\": \"...\"}"
}
```
or
```json
{
  "job_id": "job_id",
  "error": "failure reason"
}
```

## 6. Compliance Rules for Generation Output

Worker-computed draft payload must satisfy system requirements:
- strict JSON schema with fields:
  - `petition_summary`
  - `fact_analysis`
  - `legal_review`
  - `decision`
  - `action_plan`
  - `legal_basis`
  - `audit_risk.level/findings/recommendations`
- legal citation completeness:
  - law/ordinance name
  - article number
  - effective date
  - source link (if available)
- if legal basis is insufficient, set decision context to `Insufficient Legal Basis.`

## 7. Security and Audit

- Enable token auth in all worker calls (`X-WORKER-TOKEN`)
- Do not log raw personal data; input payload is masked before queueing
- Keep job/result records for audit traceability (request ID, source refs, risk level)

## 8. Troubleshooting

401/403 on worker endpoints:
- Verify `WORKER_TOKEN` matches between API and worker

503 on generation endpoints:
- Check beta gate (`BETA_MODE`, `BETA_END_DATE`)

Jobs not completing:
- Validate worker loop is running and can reach `WORKER_API_BASE_URL`
- Check `/metrics` for `jobs_failed` and processing latency

## 9. OpenClaw Deployment Notes

- Replace `scripts/worker.ts` with platform-managed OpenClaw worker implementation as needed, but keep endpoint contract unchanged.
- Preserve deterministic completion semantics: every claimed job must be completed with either `result_json` or `error`.
- Keep retry/backoff logic in worker orchestration to avoid hot-looping when queue is empty.
