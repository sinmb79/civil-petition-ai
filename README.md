# Civil Petition Decision Support System (Scaffold)

TypeScript-first monorepo scaffold for a civil petition decision support platform.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Install

```bash
pnpm install
```

## Run development server

```bash
pnpm dev
```

Starts the Next.js app at `apps/web`.

## Run tests

```bash
pnpm test
```

## Run lint/build

```bash
pnpm lint
pnpm build
```

## Module overview

- `apps/web`: Next.js frontend + API route entrypoints.
- `apps/api`: reserved for optional standalone API service.
- `packages/core`: shared contracts/types.
- `packages/legal-engine`: legal retrieval orchestration interfaces.
- `packages/draft-engine`: draft generation orchestration interfaces.
- `packages/audit-engine`: audit risk orchestration interfaces.
- `packages/citation-validator`: citation completeness checker (stub + TODO).
- `packages/logger`: audit log interface contract.
- `integrations/*`: all external API client stubs.
- `database`: Prisma schema/migrations/seed skeleton.
- `tests`: integration/unit/e2e test folders.

## Documentation

- `AGENTS.md`
- `docs/SPEC.md`
- `docs/DATA_MODEL.md`
- `docs/TASKS.md`
- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACTS.md`
