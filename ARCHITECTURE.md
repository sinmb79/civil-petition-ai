# ARCHITECTURE.md

## 1) 아키텍처 설계 목표
- **법적 추적 가능성**: 모든 처리 단계가 법적 근거(`title`, `article`, `effective_date`, `source_url`)와 연결되어야 함.
- **감사 대응 가능성**: 요청 단위 처리 이력과 리스크 산출 근거를 재현 가능하게 저장.
- **결정론적 출력**: 동일 입력 + 동일 근거셋에서 동일 JSON 결과를 반환.
- **모듈 독립성**: 엔진 단위로 분리 및 독립 테스트 가능.

---

## 2) 논리 아키텍처 (Engine-Oriented)

```text
[Client/Web UI]
    ↓
[API Gateway / Orchestrator]
    ├─ Petition Structuring Engine
    ├─ Legal Retrieval Engine
    ├─ Citation Formatter
    ├─ Draft Generation Engine
    ├─ Audit Risk Engine
    └─ Output Renderer
    ↓
[Persistence Layer]
    ├─ RDBMS (Core Entities)
    ├─ Cache (Legal API, version-aware)
    ├─ Search Index (Full-text/semantic optional)
    └─ Audit Log Store (immutable append)
```

---

## 3) 물리 아키텍처 권장 구성

### 3.1 컴포넌트
1. **Frontend**
   - 민원 입력/수정, 근거 검토, 결과 확정.
2. **Backend API**
   - 요청 검증, 오케스트레이션, 권한 제어, 상태 관리.
3. **Engine Services**
   - 도메인 로직 분리(동일 프로세스 모듈 혹은 마이크로서비스).
4. **Data Layer**
   - PostgreSQL(권장), Redis(캐시), OpenSearch/Elasticsearch(선택).
5. **Observability**
   - 중앙 로그, 메트릭, 분산 트레이싱.

### 3.2 배포 레이어
- **Dev**: 단일 노드 + 컨테이너 기반.
- **Stage**: 프로덕션 유사 구성, 성능/회귀 검증.
- **Prod**: 이중화(API, DB read replica, cache cluster), 백업/복구 정책 포함.

---

## 4) 엔진별 상세 설계

### 4.1 Petition Structuring Engine
- 입력 민원 텍스트를 표준 구조로 변환.
- 마스킹 규칙(전화번호, 주민등록번호, 계좌번호 등) 적용.
- 산출물:
  - `petition_summary`
  - 도메인 분류(처리유형, 예산연계, 재량행위 여부)

### 4.2 Legal Retrieval Engine
- 질의 확장(동의어, 조문 단위 키워드) 후 법령/조례/판례/심판/예산/감사 사례 조회.
- 우선순위:
  1) 캐시 hit (유효기간+시행일 버전 일치)
  2) 외부 API
  3) 실패 시 graceful fallback + 오류 표준화
- 중복 호출 방지: 동일 Query Key는 요청 범위 내 단일 실행.

### 4.3 Citation Formatter
- 수집 결과를 표준 Citation 형태로 정규화:
  - `title`, `article`, `effective_date`, `source_url`
- 누락 필드 발견 시 즉시 validation error.

### 4.4 Draft Generation Engine
- 고정 JSON Schema 강제.
- `decision`은 정책 enum만 허용(예: ACCEPT/PARTIAL/REJECT/TRANSFER/REQUEST_INFO).
- 근거 부족 시 반드시 “Insufficient Legal Basis / 법적 근거 불충분” 출력.

### 4.5 Audit Risk Engine
- 룰셋 기반 결정론적 평가:
  - 절차 누락
  - 재량 일탈
  - 법적 근거 부족
  - 예산 목적 외 사용
  - 특혜 가능성
  - 반복 감사 지적 패턴
- 출력:
  - `level: LOW | MODERATE | HIGH`
  - `findings[]`
  - `recommendations[]`

### 4.6 Output Renderer
- 내부 JSON을 사용자 뷰(웹/공문/다운로드 포맷)로 변환.
- 렌더링은 표현 계층만 담당(판단 로직 금지).

---

## 5) 데이터 흐름 (Request Lifecycle)
1. 사용자 민원 입력
2. 입력 검증 및 PII 마스킹
3. 민원 구조화
4. 법적 근거 검색(캐시 우선)
5. 인용 정합성 검증(필수 필드 확인)
6. 초안 생성(JSON 스키마 검증)
7. 감사 리스크 산정
8. 결과 저장 + 감사 로그 기록
9. 렌더링 및 응답

---

## 6) 저장소 설계 원칙
- 모든 핵심 엔티티는 `created_at`, `updated_at` 필수.
- 불변 로그(Audit Log)는 append-only.
- 요청 단위 추적 키:
  - `request_id`, `petition_id`, `trace_id`
- 법령 캐시는 `source_id + effective_date + version` 복합키 권장.

---

## 7) 비기능 설계

### 7.1 성능
- P95 응답시간 목표: 단계적 정의(예: 3~5초 내 1차 응답).
- Retrieval 병렬화, 외부 API timeout/circuit breaker.

### 7.2 신뢰성
- 외부 소스 장애 시 부분 결과 + 사유 표기.
- 재시도 정책(지수 백오프, 상한 횟수).

### 7.3 보안/컴플라이언스
- 전송/저장 암호화(TLS, at-rest encryption).
- 최소 권한 접근제어(RBAC).
- 개인정보 자동 마스킹 + 원문 접근 감사.

### 7.4 운영성
- 구조화 로그(JSON), 메트릭(처리량/오류율/리스크 분포), 트레이싱.
- 릴리즈 시 스키마 호환성 체크 및 마이그레이션 검증.

---

## 8) 확장 전략
- 엔진별 독립 스케일 아웃(검색/생성/리스크 엔진 분리).
- 정책 룰 버전 관리(감사 규정 변경 대응).
- 기관별 커스텀 룰/템플릿 플러그인 구조.
