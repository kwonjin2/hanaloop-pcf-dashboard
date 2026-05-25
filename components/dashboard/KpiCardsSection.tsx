"use client";

/**
 * KPI 섹션의 client wrapper — use() API 기반.
 *
 * React 19 `use()` API:
 *  - Pending → throw promise → 부모 Suspense의 fallback 표시
 *  - Resolved → 값 반환 (typed)
 *  - Rejected → throw error → 부모 ErrorBoundary의 fallback 표시
 *
 * 책임 분리:
 *  - page.tsx (RSC): promise 시작 (prisma 직접 호출)
 *  - 이 컴포넌트 (client): promise resolve + 표현 컴포넌트로 prop 전달
 *  - SectionBoundary (부모): 로딩/에러 fallback
 *
 * "use client" 필요한 이유: use() 훅을 client에서 호출 (RSC는 await로 충분).
 */
import { use } from "react";
import type { EmissionFactor } from "@/generated/prisma/client";
import type { ActivityWithRelations } from "@/lib/emissions";
import { KpiCards } from "./KpiCards";

type Props = {
  activitiesPromise: Promise<ActivityWithRelations[]>;
  factorsPromise: Promise<EmissionFactor[]>;
};

export function KpiCardsSection({ activitiesPromise, factorsPromise }: Props) {
  const activities = use(activitiesPromise);
  const factors = use(factorsPromise);
  return <KpiCards activities={activities} factors={factors} />;
}
