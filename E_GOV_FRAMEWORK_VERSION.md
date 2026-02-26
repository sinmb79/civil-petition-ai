# E_GOV_FRAMEWORK_VERSION.md

## 1) 목적
민원처리 지원 시스템을 전자정부프레임워크(eGovFrame) 기반으로 구축할 때,
버전 호환성·모듈 구조·업그레이드 정책을 표준화하기 위한 문서.

---

## 2) 권장 버전 정책

## 2.1 기준 버전
- **권장 기준**: eGovFrame 4.x 계열 (신규 구축 기준)
- **레거시 운영**: 3.x 유지 시스템은 보안패치 우선 + 단계적 전환

> 실제 도입 시점의 공식 배포 노트와 기관 표준 SW 목록을 최종 기준으로 확정.

## 2.2 버전 선택 원칙
1. 장기 유지보수(LTS) 가능 버전 우선
2. Java/Spring/빌드도구 호환성 확인
3. 보안 패치 제공 여부 확인
4. 운영기관 표준 환경(OS, WAS, DBMS)과 정합성 확인

---

## 3) 버전 구조 (예시)

```text
egovframe-stack
├─ presentation
│  ├─ web-ui (JSP/Thymeleaf or SPA gateway)
│  └─ api-gateway
├─ domain-services
│  ├─ petition-structuring-service
│  ├─ legal-retrieval-service
│  ├─ citation-formatter-service
│  ├─ draft-generation-service
│  ├─ audit-risk-service
│  └─ output-renderer-service
├─ shared
│  ├─ common-contracts (DTO, ErrorEnvelope)
│  ├─ common-security (masking, authz)
│  ├─ common-observability (logging, tracing)
│  └─ common-test-fixtures
└─ platform
   ├─ persistence (RDBMS, migration)
   ├─ cache (Redis)
   ├─ search (optional)
   └─ batch (sync/reindex jobs)
```

---

## 4) 호환성 매트릭스 운영 항목
버전 관리 테이블(운영 문서/CMDB)에 최소 다음 항목을 관리:
- eGovFrame 버전
- Java 버전
- Spring Framework/Boot 버전
- WAS(Tomcat/JEUS 등)
- DB 드라이버 버전
- 보안 라이브러리 버전
- 배포일/적용기관/담당자

---

## 5) 마이그레이션 전략

## 5.1 3.x → 4.x 전환 원칙
1. 공통 모듈 선전환(`shared/*`)
2. 엔진별 병행 운영(blue/green 혹은 canary)
3. API 계약 고정(`v1`) 유지로 소비자 영향 최소화
4. 성능/회귀/보안 점검 후 트래픽 전환

## 5.2 데이터 호환성
- 스키마 변경은 migration script로만 반영.
- `created_at`, `updated_at` 미보유 테이블 선보강.
- 감사로그 스토어는 append-only 유지.

---

## 6) 배포/운영 표준
- 환경 분리: dev/stage/prod.
- 형상 태깅: `egov4.x-appY.Z`.
- 롤백 기준: 오류율, 응답지연, 스키마 오류율 임계치.
- 운영 점검:
  - 법령 API 연동 상태
  - 캐시 hit ratio
  - 리스크 엔진 결정론 지표

---

## 7) 보안/컴플라이언스 체크리스트
- 개인정보 마스킹 모듈 버전 일치
- 취약점 점검(SCA/SAST) 정기 수행
- 접근권한 최소화(RBAC)
- 감사추적 로그 보존기간 준수

---

## 8) 권장 릴리즈 캘린더
- 월간 패치: 보안/버그 수정
- 분기 릴리즈: 기능 개선/성능 최적화
- 반기 점검: 프레임워크 업그레이드 가능성 평가
