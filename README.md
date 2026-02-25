---

# 📘 백서 (국문)

## 1. 개요

본 시스템은 전 직렬 공무원이 민원을 처리할 때 필요한
**법령·조례·판례·행정심판·예산·감사 지적사례**를 통합 검색·분석하여
“근거 기반 민원 답변서”와 “감사 리스크 분석 결과”를 자동 생성하는
지능형 민원처리 지원 플랫폼이다.

기존 시스템은 법령 검색 또는 민원 접수 기능에 집중되어 있으나,
본 플랫폼은 다음을 목표로 한다.

* 근거 조문 단위 자동 인용
* 수용/부분수용/불수용 판단 구조화
* 예산·절차 적정성 점검
* 감사 지적 가능성 사전 예측

---

## 2. 개발 배경

공무원의 민원 처리는 다음 요소에 근거하여 이루어진다.

* 법령 및 하위법령
* 자치법규(조례·규칙)
* 판례 및 행정심판 재결례
* 예산 편성 및 집행 가능성
* 내부 지침 및 매뉴얼
* 과거 감사 지적 사례

그러나 실제 업무에서는
① 자료 탐색의 분산
② 유사 사례 축적 부족
③ 감사 대응 자료 정리의 어려움
이 반복된다.

본 플랫폼은 이러한 구조적 비효율을 해소하기 위한 통합 시스템이다.

---

## 3. 시스템 목표

### 3.1 핵심 목표

1. 민원요지 자동 구조화
2. 관련 법령·조례 실시간 검색 및 조문 인용
3. 판례·행정심판 사례 추천
4. 예산 적정성 점검
5. 감사 지적 사례 매칭
6. 감사 리스크 레벨 산출
7. 공문체 형식의 답변서 자동 생성

---

## 4. 시스템 구성

### 4.1 전체 구조

입력 계층
→ 법적 근거 계층
→ 사례·판례 계층
→ 예산 검토 계층
→ 감사 리스크 계층
→ 답변 생성 엔진
→ 출력

---

## 5. 데이터 연계 구조

### 5.1 법령 API

* 법령명, 조문번호, 시행일, 개정이력
* 조문 단위 저장 및 캐시

### 5.2 자치법규

* 지자체별 조례·규칙
* 기관별 분리 저장

### 5.3 판례·행정심판

* 사건번호
* 판시사항
* 요지

### 5.4 예산 데이터

* 세부사업
* 집행 가능 여부
* 목적 외 사용 여부

### 5.5 감사 지적 사례

* 감사기관
* 지적 유형
* 처분 요구 내용
* 반복 지적 여부

---

## 6. 감사 리스크 분석 모델

### 6.1 점검 항목

* 절차 누락 여부
* 재량 일탈 가능성
* 근거 미비
* 예산 목적 외 사용 가능성
* 특정인 특혜 구조 여부
* 과거 반복 지적 유형 여부

### 6.2 리스크 등급

* 낮음 (Green)
* 주의 (Yellow)
* 높음 (Red)

---

## 7. 출력 구조

1. 민원요지
2. 사실관계 정리
3. 법적 검토
4. 처리결과 (수용/부분수용/불수용/이송)
5. 조치계획
6. 근거 인용 목록
7. 감사 리스크 분석 결과

---

## 8. 기술 아키텍처

* Frontend: 웹 기반 인터페이스
* Backend: API 통합 엔진
* DB: 관계형 DB + 검색 인덱스
* 캐시: 법령 및 사례 캐시
* 로그: 처리 이력 및 감사 대응 로그

---

## 9. 기대 효과

* 민원 처리 시간 단축
* 법적 근거 누락 방지
* 감사 대응 역량 강화
* 조직 내 지식 자산 축적
* 전 직렬 공무원 공통 활용 가능

---

## 10. 확장 방향

* 내부 지침 자동 학습
* AI 기반 유사 사례 고도화
* 기관별 맞춤 정책 모듈
* 결재 시스템 연계

---

# 📘 White Paper (English Version)

## 1. Overview

This platform is an AI-assisted administrative support system designed to help public officials process civil petitions based on:

* Statutes and regulations
* Local ordinances
* Court precedents
* Administrative appeal decisions
* Budget availability
* Audit findings

The system generates legally grounded response drafts and evaluates potential audit risks.

---

## 2. Background

Civil petition handling requires cross-referencing multiple sources:

* National legislation
* Local bylaws
* Case law
* Budgetary constraints
* Internal guidelines
* Past audit findings

Current workflows are fragmented and time-consuming.
This platform integrates all sources into a unified decision-support engine.

---

## 3. Objectives

1. Structure petition content automatically
2. Retrieve relevant legal provisions in real time
3. Recommend precedents and appeal decisions
4. Verify budget compliance
5. Match similar audit findings
6. Assess audit risk level
7. Generate formal administrative response drafts

---

## 4. System Architecture

Input Layer
→ Legal Source Layer
→ Case/Precedent Layer
→ Budget Verification Layer
→ Audit Risk Layer
→ Draft Generation Engine
→ Output

---

## 5. Data Integration

* Legal APIs (article-level retrieval)
* Local ordinance databases
* Court and appeal case databases
* Budget systems
* Public audit findings

---

## 6. Audit Risk Engine

Risk checks include:

* Procedural omission
* Abuse of discretion
* Insufficient legal basis
* Misuse of budget
* Preferential treatment risk
* Repeated audit violation pattern

Risk Levels:

* Low
* Moderate
* High

---

## 7. Output Structure

1. Petition Summary
2. Fact Analysis
3. Legal Review
4. Decision Outcome
5. Action Plan
6. Legal Citations
7. Audit Risk Report

---

## 8. Technical Framework

* Web-based interface
* API aggregation engine
* Relational database
* Search index
* Logging and traceability

---

## 9. Expected Impact

* Reduced processing time
* Improved legal accuracy
* Enhanced audit readiness
* Institutional knowledge accumulation
* Applicable across all public service sectors

---

## 10. Future Development

* Internal guideline ingestion
* AI-enhanced similarity detection
* Agency-custom modules
* Integration with approval systems

---

원하면 다음 단계로:

* 📑 투자/정부과제 제출용 확장 백서(시장성·수익모델 포함)
* 🏛 기관 내부 보고용 5페이지 요약본
* 🧠 감사 리스크 점수화 수학적 모델 상세 설계
* 🗂 개발 로드맵(6개월·12개월 버전)

어느 방향으로 확장할지 지정하면 그 버전으로 정리하겠다.

---

## 11. Operations Readiness (T16)

### 11.1 Health Check

* `GET /health`
* Response:

```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "redis": "skip",
    "external_law_api": "ok"
  },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### 11.2 Metrics

* `GET /metrics`
* Collected metrics:
  * Request processing time average (ms)
  * Law API calls
  * Law API cache hits and hit rate
  * Audit risk `HIGH` count
  * Draft generation failure count

### 11.3 Standardized Error Payload

All API errors return:

* `error_id` (UUID)
* `message` (generalized)
* `request_id`

Internal details are logged only.

### 11.4 Docker Deployment

Build image:

```bash
docker build -t civil-petition-ai:latest .
```

Run container:

```bash
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgres://example \
  -e LAW_API_BASE_URL=https://law.example.go.kr \
  civil-petition-ai:latest
```

