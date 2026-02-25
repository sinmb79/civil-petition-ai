# API Contracts (Scaffold)

## Shared Types

```ts
interface Citation {
  lawName: string;
  articleNumber: string;
  effectiveDate: string;
  sourceLink: string;
}
```

## Engine Interfaces

- `LegalRetriever` (from legal-engine)
- `AuditAssessor` (from audit-engine)
- `DraftRenderer` (from draft-engine)

## Integration Client Contracts

- `LawApiClient.request(query)`
- `OrdinanceApiClient.request(query)`
- `PrecedentApiClient.request(query)`
- `BudgetApiClient.request(query)`
- `AuditApiClient.request(query)`

## TODO

- Define request/response schemas for each integration endpoint.
- Add zod/json-schema validation for each contract.
