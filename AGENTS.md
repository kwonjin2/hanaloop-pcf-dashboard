<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
# HanaLoop PCF Dashboard

## 작업 배경
- HanaLoop 프론트엔드 채용 과제. 본인은 신입 프론트엔드 지원자
- 평가 기준: 도메인 이해 25% + 시스템 설계 30% + UX 25% + 논리적 설명 20%
- 타임박스: 2026년 5월 26일 (화) 16시까지
- 발표 20분 포함 (합격자 한정)
- AI 사용 허용. 단, 발표 시 어디서 무엇을 AI로 했는지 설명 가능해야 함

## 핵심 도메인
- PCF (Product Carbon Footprint): 제품 단위 탄소 발자국
- GHG Scope 분류:
  - Scope 1: 직접 배출 (이번 과제 데이터엔 없음)
  - Scope 2: 구매 에너지 (전기 = 한국전력)
  - Scope 3: 기타 간접 (원소재, 운송)
- 계산: 활동량 × 배출계수 = kgCO2e
- 핵심 요구사항: 배출계수는 시점별 버전 관리 (valid_from/valid_to)

## 기술 스택
- Next.js 16 App Router + TS + Tailwind
- shadcn/ui (Radix primitives + Tailwind) — 접근성 갖춘 UI primitives, copy-paste 방식
- Postgres 16 (Docker Compose)
- Prisma (ORM)
- TanStack Query (서버 상태)
- Zustand (필터 등 UI 상태)
- React Hook Form + Zod (입력 검증)
- Recharts (시각화)
- SheetJS (Excel 임포트 — 가점)

## 의도적으로 선택한 것 (왜 이런 결정을 했는지 발표에서 설명 필요)
- Prisma 채택: 타입 안전성, 자동 마이그레이션, SQL 인젝션 방어. 단점인 콜드 스타트와 복잡 쿼리 한계는 이 규모에서 무시 가능
- 활동(Activity)과 계수(Factor) 분리: 변경 주기와 책임이 다름. 단일 책임 원칙
- 시점 기반 계수 조회: 과거 데이터의 정확성 보장
- 계산 결과 캐시 안 함: 30행 규모에선 매번 계산이 더 정확하고 단순
- Postgres + Docker: SQLite보다 무겁지만 "Docker Compose 즉시 실행" 가점 + 실무 환경 일치
- 단일 페이지 + Drawer/Modal 패턴: 사용자 컨텍스트 스위칭 최소화. 단일 화면 정보 밀도가 trade-off (섹션 분리와 시각적 위계로 보완)
- shadcn/ui 도입: 접근성 갖춘 Drawer/Modal/Form을 직접 구현하는 것보다 검증된 Radix primitives를 활용하는 게 더 나은 선택. copy-paste 방식이라 소스 소유권은 유지하면서 접근성 로직은 위임
- 데스크탑 우선, 태블릿/모바일에서도 레이아웃 깨지지 않게. 모바일 풀 최적화(Table↔Card 등)는 시간 여유에 따라 추가
- 필터/검색 UI 포함: 현재 30행 규모에선 과해 보일 수 있지만, 데이터가 늘어났을 때 사용성에 도움. 확장성과 UX 면에서 가치 있는 투자

## 의도적으로 안 한 것 (YAGNI)
- 인증/멀티테넌시: 과제 범위 밖
- Redis 캐시: 데이터 규모상 불필요
- 다국가 계수: 과제 데이터는 한국만
- 다크모드: 평가 항목 아님

## 코딩 컨벤션
- 답변/설명: 한국어
- 변수명/함수명: 영어
- 주석: 도메인 설명은 한국어, 기술적 설명은 영어 (한 쪽으로 통일하여 일관성 유지)
- 커밋: 하이브리드 — type 키워드는 영어, subject는 한국어
- 각 코드 블록 앞에 "왜 이렇게 짰는지" 한 줄 주석
- any 회피, 제네릭과 Zod로 타입 안전성 확보
- 컴포넌트 단위 단일 책임 (변경 이유가 하나)
- ErrorBoundary는 페이지 단위가 아니라 섹션 단위로 격리
- Skeleton UI로 레이아웃 시프트 방지

## 커밋 컨벤션
Conventional Commits 사용:
- feat, fix, refactor, chore, docs, style, test
- subject 50자 이내
- 한 커밋 = 한 가지 일
- 도메인/스키마 결정 커밋 → UI 구현 커밋 순서

## 디렉토리 구조 (잠정)
```
hanaloop-pcf-dashboard/
├── app/
│   ├── api/
│   │   ├── activities/         활동 CRUD
│   │   ├── factors/            배출계수 CRUD
│   │   └── import/             엑셀 임포트
│   ├── layout.tsx
│   └── page.tsx                대시보드 (단일 페이지)
├── components/
│   ├── ui/                     shadcn primitives (copy-paste 소스)
│   ├── dashboard/              KPI 카드, 차트, 테이블, 필터
│   ├── activity/               활동 입력 Drawer
│   ├── factor/                 배출계수 관리 Drawer
│   ├── import/                 Excel 임포트 Modal
│   └── common/                 ErrorBoundary, Skeleton, EmptyState, Toast 등
├── lib/
│   ├── prisma.ts               Prisma client singleton
│   ├── emissions.ts            계산 로직
│   ├── format.ts               숫자/단위/날짜 포맷 유틸
│   ├── utils.ts                shadcn cn() 등 (shadcn init 시 자동 생성)
│   └── validators/             Zod 스키마
├── types/                      공유 타입
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── sample-data/                demo용 sample Excel 파일
└── ...config files (next.config.ts, tsconfig.json, components.json 등)
```

## 작업 시 주의사항
- 단위 표시 절대 빠뜨리지 말 것 (kgCO2e, kWh, kg, ton-km)
- 입력 검증 에러 메시지는 사용자가 이해 가능한 한국어로
- yarn start 한 번에 실행되어야 함 (필수 체크리스트)
- README의 빠른 실행은 5단계 이내 (필수 체크리스트)

## 도메인 결정
- 같은 일자 + 같은 항목 다중 행: 별개 측정으로 모두 보존
- 모든 일자가 매월 1일: 월 단위 보고로 해석. 일자 입력 UI는 받되 기본 뷰는 월 단위
- 배출계수 시점 정보가 명세에 없음: valid_from은 임의로 정의 (예: 2025-01-01 시작, valid_to는 null = 현재까지 유효) + README Assumptions에 명시
- 첫 시드 전략: 활동 데이터까지 풀 시드 (즉시 풍성한 대시보드) + sample Excel 별도 제공 (demo용)
- Excel 임포트 중복 처리: 같은 일자+항목+량 모두 일치 시 skip (정확 일치 dedupe)
- 반응형 범위: 데스크탑 우선, 태블릿/모바일에서도 레이아웃 깨지지 않게. 모바일 풀 최적화(Table↔Card 등)는 시간 여유에 따라 추가
- 필터/검색 UI 포함 (날짜 범위 + Scope + 활동 유형)

## 주요 UX 결정
- 비전문가 가이드: 도메인 용어(Scope, ton-km, kgCO₂e 등)에 hover tooltip
- 헤더에 1줄 onboarding 메시지
- 빈/에러/로딩 상태 3종 일관 처리
- sonner 토스트로 저장/실패 즉시 피드백
- 활동 삭제 시 confirm dialog (실수 방지)
- Scope별 일관된 색상 시스템 (색맹 친화)
- 숫자 천 단위 구분, 단위 표시 일관 (`lib/format.ts` 통일)