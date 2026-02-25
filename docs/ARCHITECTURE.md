# Architecture

## Audit Engine Responsibilities

`packages/audit-engine` provides deterministic risk scoring for audit readiness.

- Evaluates petition, planned decision, legal citations, procedure completion, budget context, and matched audit cases.
- Produces deterministic outputs (`level`, structured findings, recommendations, score breakdown).
- Performs offline audit finding matching through a keyword matcher (`matchAuditCases`) with no external dependencies.

## Rule Engine v1 Scoring Table

| Rule ID | Condition | Score |
|---|---|---:|
| `R1_MISSING_LEGAL_BASIS` | `legal_sources.length === 0` | 50 |
| `R2_INCOMPLETE_CITATION` | Any legal source missing `title/article/effective_date/source_url` | 30 |
| `R3_PROCEDURE_OMISSION` | Decision in `ACCEPT/PARTIAL/REJECT` + discretionary + missing `NOTICE` | 20 |
| `R4_BUDGET_MISUSE` | `budget_related === true` and `budget_context.purpose_match === false` | 40 |
| `R5_PREFERENTIAL_TREATMENT_SIGNAL` | Petition text contains high-risk token (`특혜`, `봐주기`, `청탁`, `민원인 요구`, `지인`, `아는 사람`, `압력`) | 25 |
| `R6_REPEAT_AUDIT_PATTERN` | `audit_cases.length >= 1` (+15), `>=3` (+25) | 15 / 25 |

Risk mapping:
- `HIGH`: total `>= 70`
- `MODERATE`: total `>= 35`
- `LOW`: total `< 35`
