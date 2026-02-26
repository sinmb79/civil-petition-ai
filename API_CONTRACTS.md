# API_CONTRACTS.md

## 1) 인터페이스 설계 원칙
- 엔진 간 통신은 **명시적 버전(v1)** 을 가진 JSON 계약 사용.
- 모든 요청/응답은 `request_id`, `timestamp`를 포함하여 추적 가능해야 함.
- 오류는 공통 `ErrorEnvelope` 형식으로 반환.
- 결정 결과는 결정론적 재현을 위해 `rule_version`, `source_snapshot_id`를 포함.

---

## 2) 공통 Envelope

### 2.1 Request Meta
```json
{
  "request_id": "uuid",
  "trace_id": "uuid",
  "requested_at": "2026-01-01T12:00:00Z",
  "api_version": "v1"
}
```

### 2.2 Error Envelope
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "citation.effective_date is required",
    "details": ["legal_basis[0].effective_date is missing"],
    "retryable": false
  },
  "request_id": "uuid",
  "timestamp": "2026-01-01T12:00:01Z"
}
```

---

## 3) Engine Contracts

## 3.1 Petition Structuring Engine
### Endpoint
`POST /api/v1/engines/petition-structuring:run`

### Request
```json
{
  "meta": {
    "request_id": "uuid",
    "trace_id": "uuid",
    "requested_at": "2026-01-01T12:00:00Z",
    "api_version": "v1"
  },
  "payload": {
    "petition_text": "string",
    "processing_type": "PERMIT|DENIAL|SUBSIDY|CONTRACT|ENFORCEMENT|OTHER",
    "budget_related": true,
    "discretionary": false,
    "agency_type": "string"
  }
}
```

### Response
```json
{
  "request_id": "uuid",
  "payload": {
    "petition_summary": "string",
    "normalized_facts": ["string"],
    "masked_fields": ["PHONE", "RRN"],
    "tags": ["도로", "점용허가"]
  }
}
```

---

## 3.2 Legal Retrieval Engine
### Endpoint
`POST /api/v1/engines/legal-retrieval:run`

### Request
```json
{
  "meta": { "request_id": "uuid", "trace_id": "uuid", "api_version": "v1" },
  "payload": {
    "query": "string",
    "jurisdiction": "NATIONAL|LOCAL",
    "include": ["STATUTE", "ORDINANCE", "PRECEDENT", "APPEAL", "BUDGET", "AUDIT"],
    "effective_date": "2026-01-01",
    "limit": 20
  }
}
```

### Response
```json
{
  "request_id": "uuid",
  "payload": {
    "sources": [
      {
        "source_type": "STATUTE",
        "title": "국가배상법",
        "article": "제2조",
        "effective_date": "2024-07-01",
        "source_url": "https://...",
        "reference_number": "법률 제00000호",
        "content_excerpt": "..."
      }
    ],
    "cache": {
      "hit": true,
      "cache_key": "sha256:...",
      "version": "2024-07-01"
    },
    "source_snapshot_id": "snapshot-uuid"
  }
}
```

---

## 3.3 Citation Formatter
### Endpoint
`POST /api/v1/engines/citation-formatter:run`

### Request
```json
{
  "meta": { "request_id": "uuid", "trace_id": "uuid", "api_version": "v1" },
  "payload": {
    "sources": [
      {
        "title": "string",
        "article": "string",
        "effective_date": "YYYY-MM-DD",
        "source_url": "https://..."
      }
    ]
  }
}
```

### Response
```json
{
  "request_id": "uuid",
  "payload": {
    "legal_basis": [
      {
        "title": "string",
        "article": "string",
        "effective_date": "YYYY-MM-DD",
        "source_url": "https://..."
      }
    ],
    "validation": {
      "is_valid": true,
      "errors": []
    }
  }
}
```

---

## 3.4 Draft Generation Engine
### Endpoint
`POST /api/v1/engines/draft-generation:run`

### Request
```json
{
  "meta": { "request_id": "uuid", "trace_id": "uuid", "api_version": "v1" },
  "payload": {
    "petition_summary": "string",
    "fact_analysis": "string",
    "legal_basis": [
      {
        "title": "string",
        "article": "string",
        "effective_date": "YYYY-MM-DD",
        "source_url": "https://..."
      }
    ],
    "policy_context": {
      "budget_related": true,
      "discretionary": false
    }
  }
}
```

### Response (Strict Schema)
```json
{
  "request_id": "uuid",
  "payload": {
    "petition_summary": "string",
    "fact_analysis": "string",
    "legal_review": "string",
    "decision": "ACCEPT|PARTIAL|REJECT|TRANSFER|REQUEST_INFO",
    "action_plan": "string",
    "legal_basis": [],
    "audit_risk": {
      "level": "LOW|MODERATE|HIGH",
      "findings": [],
      "recommendations": []
    }
  },
  "schema_validation": {
    "valid": true,
    "errors": []
  }
}
```

---

## 3.5 Audit Risk Engine
### Endpoint
`POST /api/v1/engines/audit-risk:run`

### Request
```json
{
  "meta": { "request_id": "uuid", "trace_id": "uuid", "api_version": "v1" },
  "payload": {
    "petition_context": {
      "processing_type": "string",
      "budget_related": true,
      "discretionary": true
    },
    "legal_basis": [],
    "historical_audit_findings": []
  }
}
```

### Response
```json
{
  "request_id": "uuid",
  "payload": {
    "level": "LOW|MODERATE|HIGH",
    "findings": [
      {
        "risk_type": "PROCEDURAL_OMISSION",
        "description": "필수 협의 절차 누락 가능성",
        "severity": "HIGH"
      }
    ],
    "recommendations": ["사전협의 체크리스트 수행"],
    "rule_version": "risk-rules-2026.01"
  }
}
```

---

## 3.6 Output Renderer
### Endpoint
`POST /api/v1/engines/output-renderer:run`

### Request
```json
{
  "meta": { "request_id": "uuid", "trace_id": "uuid", "api_version": "v1" },
  "payload": {
    "draft_json": {},
    "format": "WEB|PDF|DOCX",
    "locale": "ko-KR"
  }
}
```

### Response
```json
{
  "request_id": "uuid",
  "payload": {
    "rendered_content": "base64-or-html",
    "content_type": "application/pdf",
    "checksum": "sha256:..."
  }
}
```

---

## 4) Orchestrator API (통합 호출)
### Endpoint
`POST /api/v1/pipeline/decide`

### 동작
- Petition Structuring → Legal Retrieval → Citation Formatter → Draft Generation → Audit Risk → Output Renderer 순으로 실행.
- 단계별 실패 시 에러 전파 + 이미 수집된 근거/로그 저장.

### Response 핵심 필드
- `request_id`
- `final_output` (strict JSON)
- `source_snapshot_id`
- `risk_level`
- `logs_ref`

---

## 5) 상태코드 규약
- `200`: 성공
- `400`: 입력 검증 실패
- `409`: 스키마/버전 충돌
- `422`: 인용 필수 필드 누락
- `429`: 외부 API 호출 제한
- `500`: 내부 처리 오류
- `503`: 외부 의존성 장애

---

## 6) 호환성/버저닝 정책
- Major 변경(`v1 → v2`)은 breaking change.
- Minor 변경은 optional 필드 추가만 허용.
- Deprecated 필드는 최소 2개 릴리즈 유지 후 제거.
