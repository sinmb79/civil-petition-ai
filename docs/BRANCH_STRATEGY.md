# Branch Strategy

권장 브랜치 운영 전략은 아래와 같습니다.

## Permanent Branches

- `main`: 항상 배포 가능한 상태 유지
- `dev`: 기능 통합 및 통합 테스트 브랜치

## Feature Branches

- `feature/legal-engine`
- `feature/audit-engine`
- `feature/draft-engine`

## Working Rules

1. Codex 작업은 기능 단위(feature branch)로 분리한다.
2. 각 feature branch는 단일 엔진(또는 단일 책임)만 다룬다.
3. `dev`에는 feature 단위 PR로 병합하고, `main`은 릴리스 검증 후 병합한다.
4. 각 PR은 독립 테스트 가능한 단위와 테스트 결과를 포함한다.
