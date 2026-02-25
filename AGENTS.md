---

# 📄 File Title (English First)

## **AGENTS.md**

**AI Development Instruction Manual for the Civil Petition Decision Support System**

---

# 🇬🇧 English Version

## 1. Purpose

This document defines the operational instructions for AI agents (including OpenAI Codex) responsible for developing the Civil Petition Decision Support System.

The AI agent must follow this specification strictly and prioritize:

* Legal traceability
* Audit compliance
* Deterministic structured outputs
* Test-driven development
* Modular architecture

---

## 2. System Objective

Build a web-based decision-support platform that:

1. Accepts civil petition input
2. Retrieves relevant legal sources (laws, ordinances, precedents, appeal decisions, budget data)
3. Generates structured administrative draft responses
4. Performs audit risk analysis
5. Produces legally cited and review-ready output

---

## 3. Mandatory Development Principles

### 3.1 Traceable Legal Citations

Every generated response must include:

* Law/Ordinance name
* Article number
* Effective date
* Source reference link (if available)

Missing citation fields must fail validation.

---

### 3.2 Structured Output Requirement

All AI-generated responses must conform to a strict JSON schema:

```
{
  "petition_summary": "",
  "fact_analysis": "",
  "legal_review": "",
  "decision": "",
  "action_plan": "",
  "legal_basis": [],
  "audit_risk": {
      "level": "",
      "findings": [],
      "recommendations": []
  }
}
```

Non-conforming output must be rejected.

---

### 3.3 Audit Risk Evaluation Rules

The system must evaluate:

* Procedural omission
* Abuse of discretion
* Lack of legal basis
* Budget misuse
* Preferential treatment risk
* Repeated audit findings pattern

Risk levels:

* LOW
* MODERATE
* HIGH

---

### 3.4 Modularity

The system must be divided into engines:

1. Petition Structuring Engine
2. Legal Retrieval Engine
3. Citation Formatter
4. Draft Generation Engine
5. Audit Risk Engine
6. Output Renderer

Each engine must be independently testable.

---

### 3.5 Caching Policy

* Legal API results must be cached.
* Duplicate external calls are prohibited when cached data exists.
* Cache must include version/effective-date awareness.

---

### 3.6 Logging

Every generation event must log:

* Timestamp
* Request ID
* Source references used
* Risk level assigned

Logs must support audit traceability.

---

## 4. Data Model Constraints

Core entities:

* Petition
* LegalSource
* Citation
* DraftReply
* AuditFinding

Each entity must include created_at and updated_at fields.

---

## 5. Testing Requirements

The AI agent must:

* Write unit tests for each engine
* Ensure citation completeness validation
* Test failure cases (API timeout, empty result, invalid schema)
* Maintain minimum 80% test coverage

---

## 6. Security & Compliance

* Personal data must be masked automatically.
* No legal interpretation beyond retrieved sources.
* No fabrication of citations.
* If insufficient data, system must state “Insufficient Legal Basis.”

---

## 7. Completion Criteria

The task is complete only if:

* All tests pass
* JSON schema validation passes
* Citation completeness verified
* Audit risk engine produces deterministic output
* No hard-coded legal content

---

---

# 🇰🇷 국문 버전

## 1. 목적

본 문서는 민원처리 지원 시스템을 개발하는 AI 에이전트(OpenAI Codex 포함)가 반드시 준수해야 할 개발 지침서이다.

AI는 다음을 최우선으로 한다.

* 법적 추적 가능성
* 감사 대응 가능성
* 구조화된 출력
* 테스트 기반 개발
* 모듈형 설계

---

## 2. 시스템 목표

본 시스템은 다음을 수행하는 웹 기반 플랫폼이다.

1. 민원 입력 수집
2. 관련 법령·조례·판례·행정심판·예산 자료 검색
3. 구조화된 공문체 답변 생성
4. 감사 리스크 분석 수행
5. 인용 근거가 포함된 최종 문서 출력

---

## 3. 필수 개발 원칙

### 3.1 법적 근거 인용 필수

모든 답변에는 반드시 포함되어야 한다.

* 법령/조례 명칭
* 조문 번호
* 시행일
* 출처 링크

누락 시 검증 실패 처리.

---

### 3.2 구조화 출력(JSON 강제)

AI 출력은 반드시 정해진 JSON 스키마를 따른다.

스키마 불일치 시 오류 처리.

---

### 3.3 감사 리스크 평가

다음 항목을 반드시 점검한다.

* 절차 누락
* 재량 일탈
* 법적 근거 부족
* 예산 목적 외 사용
* 특혜 가능성
* 반복 지적 사례 여부

리스크 등급:

* 낮음
* 주의
* 높음

---

### 3.4 모듈 분리

다음 엔진을 독립 구현한다.

1. 민원 구조화 엔진
2. 법령 검색 엔진
3. 인용 포맷 엔진
4. 답변 생성 엔진
5. 감사 리스크 엔진
6. 출력 렌더링 엔진

---

### 3.5 캐시 정책

* 법령 API 결과는 캐시 처리
* 동일 요청 중복 호출 금지
* 시행일 기준 버전 관리

---

### 3.6 로그 기록

모든 처리 과정은 다음을 기록한다.

* 요청 시각
* 요청 ID
* 사용된 근거 목록
* 리스크 등급

---

## 4. 데이터 모델 기본 조건

핵심 엔티티:

* 민원
* 법적 근거
* 인용
* 답변서
* 감사 지적

모든 테이블에 생성일/수정일 필드 포함.

---

## 5. 테스트 조건

* 각 엔진별 단위 테스트 작성
* 근거 누락 검증 테스트
* API 실패 테스트
* 최소 80% 이상 커버리지 확보

---

## 6. 보안 및 준수

* 개인정보 자동 마스킹
* 근거 없는 법 해석 금지
* 출처 없는 인용 생성 금지
* 근거 부족 시 “법적 근거 불충분” 명시

---

## 7. 완료 기준

다음 조건 충족 시 완료로 본다.

* 테스트 전부 통과
* JSON 검증 통과
* 근거 인용 완전성 확인
* 감사 리스크 결정 규칙적 동작
* 법령 내용 하드코딩 금지

---

원하면,

* 📁 추가로 `SPEC.md`, `DATA_MODEL.md`, `TASKS.md`까지 Codex 실행용 패키지로 구성해 줄 수 있다.
