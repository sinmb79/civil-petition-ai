# Development Tasks

## T6 – Audit Risk Rule Engine ✅ Implemented

Implemented files:
- Engine: `packages/audit-engine/src/engine.ts`
- Offline matcher: `packages/audit-engine/src/matcher.ts`
- Type contracts: `packages/core/src/types.ts`, `packages/audit-engine/src/index.ts`, `docs/API_CONTRACTS.md`
- Tests: `packages/audit-engine/tests/audit-engine.integration.test.ts`
- Fixture corpus: `tests/fixtures/audit_cases.sample.json`

Validation status:
- Deterministic rule scoring and risk level mapping complete.
- Offline audit-case matching complete.
- Six integration scenarios for rule triggers and score assertions included.
