/**
 * 대시보드 메인 페이지 — RSC entry point.
 *
 * Next.js 16 best practice (공식 docs `fetching-data` / `backend-for-frontend`):
 *  - Server Component에서 ORM 직접 호출 (credentials/쿼리 로직이 클라이언트 번들 외부)
 *  - await 없이 promise만 시작 → parallel fetching
 *  - 자식 client component가 use() API로 promise resolve → Suspense가 자동 처리
 *  - SectionBoundary가 섹션별 fault isolation (한 섹션 실패 ≠ 전체 차단)
 *
 * 폐기된 것:
 *  - Route Handler: 외부 클라이언트 없으므로 BFF 패턴 불필요
 *  - TanStack Query: community option이며 RSC + use() API로 충분
 *
 * 2b 단계에서 ScopeChart/MonthlyTrend/Hotspot/Table Section을 같은 패턴으로 추가.
 */
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiCardsSection } from "@/components/dashboard/KpiCardsSection";
import { KpiSkeleton } from "@/components/dashboard/KpiSkeleton";
import { ScopeChartSection } from "@/components/dashboard/ScopeChartSection";
import { ScopeChartSkeleton } from "@/components/dashboard/ScopeChartSkeleton";
import { SectionBoundary } from "@/components/common/SectionBoundary";

export default function DashboardPage() {
  // await 없이 promise 시작 → 두 쿼리 병렬 (waterfall 방지)
  // 자식 client component가 use()로 resolve, Suspense가 로딩 처리
  const activitiesPromise = prisma.activity.findMany({
    include: { item: { include: { type: true } } },
    orderBy: { date: "asc" },
  });
  const factorsPromise = prisma.emissionFactor.findMany({
    orderBy: [{ itemId: "asc" }, { validFrom: "asc" }],
  });

  return (
    <main className="container mx-auto max-w-7xl space-y-6 p-6">
      <DashboardHeader />

      <SectionBoundary name="KPI" fallback={<KpiSkeleton />}>
        <KpiCardsSection
          activitiesPromise={activitiesPromise}
          factorsPromise={factorsPromise}
        />
      </SectionBoundary>

      <SectionBoundary name="Scope 분포" fallback={<ScopeChartSkeleton />}>
        <ScopeChartSection
          activitiesPromise={activitiesPromise}
          factorsPromise={factorsPromise}
        />
      </SectionBoundary>
    </main>
  );
}
