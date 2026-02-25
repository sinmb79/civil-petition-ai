# Audit Risk Model (T18)

## 1) 점수 계산 공식

감사 리스크 점수는 규칙 기반으로 산정한다.

- 입력 리스크 항목별 기본 점수: `base_score`
- 기관별 기본 가중치: `base_weight`
- 반복 지적 가중 배수: `escalation_factor`

리스크 항목별 점수:

```text
weighted_base_score = base_score * base_weight
adjusted_score = weighted_base_score * escalation_factor   (반복 지적 조건 충족 시)
adjusted_score = weighted_base_score                       (그 외)
```

최종 점수:

```text
total_score = Σ adjusted_score
```

레벨 산정 기준(결정론적):

- `LOW`: total_score < 4
- `MODERATE`: 4 <= total_score < 8
- `HIGH`: total_score >= 8

## 2) Tenant Profile 적용 방식

`TenantRiskProfile`은 기관별 취약 영역을 반영하기 위한 설정 모델이다.

- `tenant_id`
- `risk_type`
- `base_weight`
- `escalation_factor`
- `updated_at`

엔진은 `tenant_id + risk_type`로 프로필을 조회하고, 해당 프로필이 있으면
`base_weight`, `escalation_factor`를 적용한다. 프로필이 없으면 기본값 `1`을 사용한다.

## 3) 반복 판단 로직

`AuditFindingAggregate`로 기관/유형별 반복 통계를 유지한다.

- `tenant_id`
- `risk_type`
- `count`
- `last_detected_at`

반복 지적 조건:

1. 동일 `tenant_id`, 동일 `risk_type`
2. 최근 6개월 이내(`last_detected_at` 기준)
3. 누적 `count >= 3`

세 조건 충족 시 `escalation_factor`를 적용한다.

## 4) Explainability

`AuditRiskOutput.explain[]`에는 각 규칙 점수의 계산 근거를 남긴다.

```json
{
  "rule_id": "RULE_PROC_001",
  "base_score": 3,
  "adjusted_score": 4.5,
  "reason": "PROCEDURAL_OMISSION repeated 3+ times in 6 months for tenant tenant-a; escalation_factor applied"
}
```

필드 설명:

- `rule_id`: 규칙 식별자
- `base_score`: 기관 기본 가중치 적용 이후 점수(`base_score * base_weight`)
- `adjusted_score`: 반복 가중치까지 반영된 최종 점수
- `reason`: 가중치 적용 이유
