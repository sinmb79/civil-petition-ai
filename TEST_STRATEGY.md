# TEST_STRATEGY.md

## 1) 테스트 목표
- 엔진 단위 품질 보증 및 회귀 방지.
- 법적 근거 인용 완전성(`title/article/effective_date/source_url`) 강제.
- 결정론적 리스크 산정 재현.
- 최소 커버리지 **80% 이상** 유지.

---

## 2) 테스트 피라미드

1. **Unit Test (70%)**
   - 각 엔진 순수 로직 검증.
   - 룰 평가, 스키마 검증, 캐시 키 계산 등.
2. **Integration Test (20%)**
   - 엔진 간 인터페이스(API_CONTRACTS) 호환성 검증.
   - DB/Cache/외부 API mock 연동.
3. **E2E Test (10%)**
   - 민원 입력부터 최종 JSON/렌더링까지 파이프라인 검증.

---

## 3) 엔진별 필수 테스트

## 3.1 Petition Structuring Engine
- 정상 입력에서 구조화 요약 생성.
- 개인정보 마스킹 규칙 적용 여부.
- 빈 문자열/과대 입력/지원하지 않는 유형 처리.

## 3.2 Legal Retrieval Engine
- 캐시 hit 시 외부 API 미호출.
- 캐시 miss 시 API 호출 후 저장.
- API timeout/failure 시 fallback 및 에러 코드 매핑.
- effective_date 버전 키 분리 검증.

## 3.3 Citation Formatter
- 필수 필드 누락 시 즉시 실패(422).
- 링크 형식 검증(유효 URL).
- 중복 citation 정규화.

## 3.4 Draft Generation Engine
- 고정 JSON Schema 100% 준수 검증.
- 허용되지 않은 decision enum 거부.
- 근거 부족 시 “법적 근거 불충분” 포함.

## 3.5 Audit Risk Engine
- 동일 입력의 결과 결정론적 동일성.
- 6개 리스크 축 각각 트리거/비트리거 검증.
- 리스크 레벨 임계치 경계 테스트(LOW↔MODERATE↔HIGH).

## 3.6 Output Renderer
- WEB/PDF/DOCX 형식별 렌더링 성공 여부.
- 입력 checksum 기반 결과 추적 가능성.

---

## 4) 공통 실패 시나리오 테스트
- 외부 API timeout
- 외부 API 빈 결과
- invalid schema
- citation 필수값 누락
- 로그 저장 실패(재시도/보상 처리)
- 캐시 장애(우회 모드)

---

## 5) 테스트 데이터 전략
- **Synthetic 데이터 기본**: 개인정보 포함 금지.
- 법령/판례 샘플은 식별 가능한 공식 메타만 사용.
- Golden Dataset(고정 기대값) 운영:
  - 리스크 판정 회귀 검출
  - 스키마 출력 스냅샷 비교

---

## 6) 자동화 파이프라인 (CI)
권장 단계:
1. Lint/Format
2. Unit Tests
3. Integration Tests
4. Contract Tests (API schema diff)
5. Coverage Gate (>=80%)
6. E2E Smoke

실패 시 merge 차단.

---

## 7) 계약 테스트(Contract Testing)
- `API_CONTRACTS.md`를 기준으로 request/response JSON schema 생성.
- provider/consumer 양측에서 schema 검증.
- breaking change 탐지 시 빌드 실패.

---

## 8) 결정론 보장 테스트
- seed 고정 + 시간 의존성 주입(mock clock).
- 외부 호출 결과 snapshot 고정.
- 동일 `source_snapshot_id` 입력 시 출력 해시 동일성 확인.

---

## 9) 비기능 테스트
- 성능: P95 응답시간, 병렬 요청 처리량.
- 부하: 캐시 hit ratio에 따른 지연 변화.
- 복원력: 의존성 장애 시 degraded mode.
- 보안: 마스킹 누락, 접근권한, 감사로그 위변조 방지.

---

## 10) 산출물/리포팅
- 테스트 리포트(성공/실패/플레이키)
- 커버리지 리포트(모듈별)
- 스키마 적합성 리포트
- 리스크 엔진 결정론 리포트
