# Civil Petition AI

**민원처리 결정 지원 시스템 — 법적 근거 있는 답변서를 자동으로 만들어줍니다**

민원 내용을 입력하면, 관련 법령을 찾아 구조화된 공문체 답변 초안과 감사 리스크 평가를 함께 만들어줍니다.
모든 인용에는 법령 명칭·조문 번호·시행일이 포함됩니다. 없는 근거는 만들어내지 않습니다.

---

## 이 시스템이 하는 일

```
민원 텍스트 입력
        ↓
① 민원 구조화      핵심 쟁점·처리 유형 정리
        ↓
② 법령 검색        관련 법률·조례·판례·행정심판·예산 자료 검색
        ↓
③ 인용 포맷 정리   법령명·조문·시행일·출처 링크 형식 통일
        ↓
④ 답변 초안 생성   공문체 구조(요지·사실관계·법적검토·처리결과·조치계획) 작성
        ↓
⑤ 감사 리스크 평가 절차 누락·재량 일탈·법적 근거 부족 등 자동 점검
        ↓
⑥ 결과 출력        JSON 형식으로 저장 + 문서 템플릿으로 렌더링
```

처리 결과는 이런 형태로 나옵니다.

```json
{
  "petition_summary": "도로 점용허가 신청에 대한 처리 결과 요청",
  "fact_analysis": "신청인은 2026-01-15 ○○시 ○○로 구간 임시 점용을 신청...",
  "legal_review": "도로법 제61조 제1항에 따라...",
  "decision": "ACCEPT",
  "action_plan": "허가증 발급 후 14일 이내 통보",
  "legal_basis": [
    {
      "title": "도로법",
      "article": "제61조 제1항",
      "effective_date": "2024-01-01",
      "source_url": "https://..."
    }
  ],
  "audit_risk": {
    "level": "LOW",
    "findings": [],
    "recommendations": []
  }
}
```

---

## 준비물

**반드시 있어야 하는 것**

- **Node.js 18 이상**
  `node --version`으로 확인합니다. 없으면 [nodejs.org](https://nodejs.org/)에서 LTS 버전을 받습니다.

- **pnpm**
  이 프로젝트의 패키지 매니저입니다.
  ```bash
  npm install -g pnpm
  ```

- **PostgreSQL** (서버 실행 시 필요)
  로컬 PC에 PostgreSQL이 설치되어 있어야 합니다.
  테스트만 돌릴 거라면 PostgreSQL 없이도 가능합니다.

---

## 설치 방법

### 1단계 — 저장소 내려받기

```bash
git clone https://github.com/sinmb79/civil-petition-ai.git
cd civil-petition-ai
```

### 2단계 — 패키지 설치

```bash
pnpm install
```

### 3단계 — 환경설정 파일 만들기

프로젝트 루트에 `.env` 파일을 만듭니다.

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/civil_petition_ai?schema=public"
WORKER_TOKEN="dev-worker-token"
GENERATION_MODE="async"
BETA_MODE="false"
DRAFT_TTL_HOURS="24"
```

각 값의 의미:

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 접속 주소 | — |
| `WORKER_TOKEN` | 워커 인증 토큰 (임의 문자열 가능) | — |
| `GENERATION_MODE` | `async`(비동기) 또는 `sync`(동기) | `async` |
| `BETA_MODE` | 베타 기간 제한 여부 | `false` |
| `BETA_END_DATE` | 베타 종료 날짜 (예: `2026-12-31T23:59:59Z`) | — |
| `DRAFT_TTL_HOURS` | 초안 보관 시간 | `24` |

### 4단계 — Prisma 클라이언트 생성

```bash
pnpm prisma:generate
```

`database/schema.prisma`를 읽어 TypeScript용 DB 접근 코드를 자동으로 만들어줍니다.
이 단계를 건너뛰면 `pnpm dev` 실행 시 타입 오류가 납니다.

### 5단계 — 데이터베이스 마이그레이션

```bash
pnpm prisma:migrate
```

PostgreSQL에 테이블을 생성합니다. PostgreSQL이 실행 중이어야 합니다.

### 6단계 — 시드 실행 (선택)

```bash
pnpm prisma:seed
```

초기 스캐폴드를 실행합니다. 실제 민원 데이터를 삽입하지는 않습니다.

---

## 서버 실행

```bash
pnpm dev
```

`Server listening on port 3000` 메시지가 나오면 정상입니다.

상태 확인:

```bash
curl http://localhost:3000/health
```

---

## 처음 써보기 — 민원 등록부터 답변 초안까지

### Step 1 — 민원 등록

```bash
curl -X POST http://localhost:3000/api/petitions \
  -H "Content-Type: application/json" \
  -d '{
    "raw_text": "도로 점용허가 신청 결과를 알고 싶습니다. 2026년 1월 신청했으나 아직 답변이 없습니다.",
    "processing_type": "permit"
  }'
```

응답에서 `id`를 복사해둡니다.

```json
{ "id": "abc-123-def", "raw_text": "...", "processing_type": "permit" }
```

### Step 2 — 답변 초안 생성 요청

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{ "petition_id": "abc-123-def" }'
```

응답에서 `job_id`를 복사해둡니다.

```json
{ "job_id": "job-xyz-789", "status": "QUEUED" }
```

### Step 3 — 워커 실행

새 터미널을 열고:

```bash
WORKER_TOKEN=dev-worker-token \
WORKER_API_BASE_URL=http://127.0.0.1:3000 \
pnpm worker:start
```

워커는 큐에 쌓인 작업을 순서대로 처리합니다.

### Step 4 — 결과 조회

```bash
curl http://localhost:3000/api/jobs/job-xyz-789
```

`status`가 `COMPLETED`가 되면 `result` 안에 답변 초안이 들어 있습니다.

---

## API 전체 목록

### 민원 CRUD

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/petitions` | 민원 등록 |
| `GET` | `/api/petitions?limit=20&offset=0` | 민원 목록 조회 |
| `GET` | `/api/petitions/:id` | 민원 단건 조회 |
| `PATCH` | `/api/petitions/:id` | 민원 수정 |
| `DELETE` | `/api/petitions/:id` | 민원 삭제 |

민원 등록 시 필수 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| `raw_text` | string (최소 10자) | 민원 원문 |
| `processing_type` | string | 처리 유형 (예: `permit`, `denial`, `subsidy`) |

### 답변 초안 생성 (비동기)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/generate` | 초안 생성 작업 등록 |
| `GET` | `/api/jobs/:job_id` | 작업 상태 및 결과 조회 |

### 워커 (내부 용도)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/worker/claim` | 작업 한 건 수령 |
| `POST` | `/api/worker/complete` | 작업 결과 제출 |

워커 API는 `X-WORKER-TOKEN` 헤더 인증이 필요합니다.

### 기타

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/health` | 서버 상태 확인 |
| `GET` | `/metrics` | 처리 통계 |

---

## 비동기 처리 흐름 이해하기

답변 초안 생성에는 시간이 걸립니다. 요청을 즉시 처리하지 않고 큐에 넣고 워커가 순서대로 처리합니다.

```
클라이언트                API 서버                    워커
    |                        |                           |
    |  POST /api/generate     |                           |
    |----------------------->|                           |
    |  { job_id, QUEUED }     |                           |
    |<-----------------------|                           |
    |                        |  POST /api/worker/claim   |
    |  GET /api/jobs/:id      |<--------------------------|
    |----------------------->|  { job_id, petition }     |
    |  { PROCESSING }         |-------------------------->|
    |<-----------------------|                           |  초안 생성 중
    |                        |  POST /api/worker/complete|
    |  GET /api/jobs/:id      |<--------------------------|
    |----------------------->|  { result: {...} }        |
    |  { COMPLETED, result }  |                           |
    |<-----------------------|                           |
```

동기 처리가 필요하면 `.env`에서 `GENERATION_MODE=sync`로 변경합니다.

---

## 감사 리스크 엔진 이해하기

모든 민원 처리 결과에 감사 리스크를 자동으로 평가합니다.

**점검 항목**

| 리스크 유형 | 설명 |
|-------------|------|
| 절차 누락 | 필수 절차를 빠뜨린 경우 |
| 재량 일탈 | 법령 범위를 벗어난 처분 |
| 법적 근거 부족 | 인용 법령이 불충분한 경우 |
| 예산 목적 외 사용 | 예산 관련 민원의 사용 목적 불일치 |
| 특혜 가능성 | 유사 사례 대비 불균형한 처리 |
| 반복 지적 패턴 | 동일 기관에서 같은 유형 3회 이상 반복 |

**리스크 등급 기준**

| 등급 | 점수 범위 |
|------|-----------|
| LOW | 4 미만 |
| MODERATE | 4 이상 8 미만 |
| HIGH | 8 이상 |

기관별 과거 지적 이력이 누적되면 가중치가 자동으로 높아집니다.
같은 리스크 유형이 최근 6개월 내 3회 이상 발생하면 escalation_factor가 적용됩니다.

자세한 점수 계산 공식은 `docs/AUDIT_MODEL.md`를 참고하세요.

---

## 테스트 실행

통합 테스트는 SQLite를 사용해서 PostgreSQL 없이도 실행됩니다.

처음 실행 전에 테스트용 DB를 초기화합니다.

```bash
pnpm db:push:test
pnpm prisma:generate:test
```

전체 테스트 실행:

```bash
pnpm test
```

개별 실행:

```bash
pnpm test:jest       # Jest 테스트
pnpm test:node       # Node.js 기본 테스트
pnpm test:watch      # 감시 모드 (파일 수정 시 자동 재실행)
```

---

## 만료된 작업 정리

```bash
pnpm cleanup:jobs
```

`DRAFT_TTL_HOURS` 설정값보다 오래된 작업이 자동으로 삭제됩니다.

---

## 프로젝트 구조

```
civil-petition-ai/
├── src/
│   ├── server.ts                      진입점 (포트 3000)
│   ├── app.ts                         Express 앱 설정
│   ├── api/
│   │   ├── petitionRoutes.ts          민원 CRUD + 초안 생성 API
│   │   └── generationRoutes.ts        워커 API
│   ├── petition/
│   │   └── petitionService.ts         민원 처리 서비스 레이어
│   ├── services/
│   │   └── draftGenerationService.ts  초안 생성 서비스
│   ├── repository/                    DB 접근 레이어 (Prisma)
│   ├── http/
│   │   ├── betaGate.ts                베타 기간 만료 제어
│   │   └── response.ts                공통 응답 형식
│   ├── observability/
│   │   └── metrics.ts                 처리 통계 수집
│   └── civil_petition_ai/             Python 엔진 모듈
│       └── engines/
│           ├── petition_structuring/  민원 구조화 엔진
│           ├── legal_retrieval/       법령 검색 엔진
│           ├── citation_formatter/    인용 포맷 엔진
│           ├── draft_generation/      답변 초안 생성 엔진
│           ├── audit_risk/            감사 리스크 평가 엔진
│           └── output_renderer/       출력 렌더링 엔진
├── database/
│   ├── schema.prisma                  메인 DB 스키마 (PostgreSQL)
│   ├── schema.test.prisma             테스트용 스키마 (SQLite)
│   └── migrations/                    DB 마이그레이션 파일
├── rules/
│   ├── pii_patterns.yml               개인정보 탐지 패턴
│   ├── forbidden_claims.ko.yml        금지 표현 목록
│   └── consistency_phrases.ko.yml     표현 일관성 규칙
├── scripts/
│   ├── worker.ts                      로컬 워커 실행 스크립트
│   └── cleanup.ts                     만료 작업 정리 스크립트
└── tests/                             테스트 파일
```

---

## 자주 만나는 문제

### `pnpm prisma:generate` 오류

스키마 파일이 있는지 확인합니다.

```bash
ls database/schema.prisma
```

파일이 있는데도 오류가 나면 `pnpm install`을 다시 실행합니다.

### `pnpm prisma:migrate` — PostgreSQL 연결 실패

`.env`의 `DATABASE_URL`이 맞는지 확인합니다.

```bash
# macOS/Linux
pg_isready

# Windows PowerShell
Get-Service -Name postgresql*
```

PostgreSQL이 없으면 [postgresql.org](https://www.postgresql.org/download/)에서 설치합니다.

### 워커에서 `401 Unauthorized` 오류

서버와 워커의 `WORKER_TOKEN` 값이 같아야 합니다.

```bash
# 서버
WORKER_TOKEN=my-secret pnpm dev

# 워커
WORKER_TOKEN=my-secret WORKER_API_BASE_URL=http://127.0.0.1:3000 pnpm worker:start
```

### `/api/generate`에서 503 응답

`BETA_MODE=true`이고 `BETA_END_DATE`가 지난 경우입니다.
`.env`에서 `BETA_MODE=false`로 바꾸거나 `BETA_END_DATE`를 미래 날짜로 수정합니다.

### 테스트에서 DB 연결 오류

테스트용 SQLite DB를 먼저 초기화합니다.

```bash
pnpm db:push:test
pnpm prisma:generate:test
pnpm test
```

---

## 보안 원칙

이 시스템이 절대 하지 않는 것:

- 없는 법령을 만들어내지 않습니다. 근거가 불충분하면 "법적 근거 불충분"으로 명시합니다.
- 개인정보(주민번호·연락처 등)는 `rules/pii_patterns.yml` 규칙으로 자동 마스킹됩니다.
- 금지 표현 목록에 있는 단언적 법 해석은 출력하지 않습니다.

모든 처리 과정은 요청 ID·타임스탬프·사용된 근거·리스크 등급과 함께 기록됩니다.

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| `SPEC.md` | 기능 요구사항 명세서 |
| `AGENTS.md` | AI 개발 에이전트 지침 (OpenClaw·Codex 연동 참고) |
| `DATA_MODEL.md` | 데이터 모델 상세 정의 |
| `docs/AUDIT_MODEL.md` | 감사 리스크 점수 계산 공식 및 반복 지적 판단 로직 |
| `OPENCLAW_PLAYBOOK.md` | OpenClaw 워커 연동 가이드 |

---

## 라이선스

MIT License
