# API Contracts

## Audit Risk Engine Contracts

```ts
export interface AuditFinding {
  id: string;
  risk_type: string;
  description: string;
  recommendation: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AuditCase {
  source: string;
  title: string;
  reference: string;
  date: string;
  summary: string;
  tags: string[];
}

export interface AuditRiskInput {
  petition: {
    id: string;
    raw_text: string;
    processing_type: string;
    budget_related: boolean;
    discretionary: boolean;
  };
  decision: 'ACCEPT' | 'PARTIAL' | 'REJECT' | 'TRANSFER' | 'REQUEST_INFO';
  legal_sources: LegalSource[];
  procedural_steps_completed?: string[];
  budget_context?: {
    available?: boolean;
    purpose_match?: boolean;
  };
  audit_cases?: AuditCase[];
}

export interface AuditRiskOutput {
  level: 'LOW' | 'MODERATE' | 'HIGH';
  findings: AuditFinding[];
  recommendations: string[];
  score_breakdown: {
    total: number;
    by_rule: Record<string, number>;
  };
}
```

Types are implemented in `packages/core/src/types.ts` and re-exported by `packages/audit-engine/src/index.ts`.
