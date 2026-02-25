# Architecture

## Monorepo Boundaries

- `apps/web`: Next.js UI and API route entrypoints.
- `apps/api`: placeholder for optional standalone API service.
- `packages/core`: shared domain types.
- `packages/legal-engine`: legal retrieval orchestration via injected interfaces.
- `packages/draft-engine`: draft generation orchestration via injected interfaces.
- `packages/audit-engine`: audit risk orchestration via injected interfaces.
- `packages/citation-validator`: citation completeness validation helper.
- `packages/logger`: audit-friendly logging interfaces.
- `integrations/*`: only location for external API clients.
- `database`: Prisma schema, migrations, and seed scripts.
- `tests`: integration/e2e/unit test scaffolding.

## Rules

1. Engine packages must not call external APIs directly.
2. Integrations provide adapter clients and are injected into engines.
3. All cross-module data contracts live in `packages/core` and `docs/API_CONTRACTS.md`.
