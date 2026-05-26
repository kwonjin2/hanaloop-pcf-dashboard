/**
 * 대시보드 메인 페이지 — RSC entry point.
 *
 * Next.js 16 best practice (공식 docs):
 *  - Server Component에서 ORM 직접 호출
 *  - searchParams prop으로 URL 필터 받음 (database 필터링은 searchParams 정석)
 *  - await 없이 promise만 시작 → parallel fetching
 *  - 자식 client component가 use() API로 promise resolve → Suspense가 자동 처리
 *  - SectionBoundary가 섹션별 fault isolation
 *
 * 폐기:
 *  - Route Handler (외부 클라이언트 없음)
 *  - TanStack Query (RSC + use() API로 충분)
 *  - Zustand (URL searchParams가 SSOT)
 */
import { prisma } from "@/lib/prisma";
import { buildActivityWhere, type ActivityFilters } from "@/lib/filters";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KpiCardsSection } from "@/components/dashboard/KpiCardsSection";
import { KpiSkeleton } from "@/components/dashboard/KpiSkeleton";
import { ScopeChartSection } from "@/components/dashboard/ScopeChartSection";
import { ScopeChartSkeleton } from "@/components/dashboard/ScopeChartSkeleton";
import { MonthlyTrendSection } from "@/components/dashboard/MonthlyTrendSection";
import { MonthlyTrendSkeleton } from "@/components/dashboard/MonthlyTrendSkeleton";
import { HotspotSection } from "@/components/dashboard/HotspotSection";
import { HotspotSkeleton } from "@/components/dashboard/HotspotSkeleton";
import { ActivityTableSection } from "@/components/dashboard/ActivityTableSection";
import { ActivityTableSkeleton } from "@/components/dashboard/ActivityTableSkeleton";
import { SectionBoundary } from "@/components/common/SectionBoundary";

type Props = {
  // Next.js 16: searchParams는 Promise. async page에서 await 필요.
  searchParams: Promise<ActivityFilters>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const rawFilters = await searchParams;

  // ESG 보고는 annual report가 표준 → 사용자가 date 관련 param 명시 안 했으면
  // 자동으로 최신 연도 default 적용. 시드/임포트 변경에 자동 대응.
  const hasExplicitDate =
    "year" in rawFilters || "from" in rawFilters || "to" in rawFilters;
  let filters = rawFilters;
  if (!hasExplicitDate) {
    const latest = await prisma.activity.findFirst({
      orderBy: { date: "desc" },
      select: { date: true },
    });
    if (latest) {
      filters = { ...rawFilters, year: String(latest.date.getFullYear()) };
    }
  }

  const where = buildActivityWhere(filters);

  // FilterBar/DashboardActions의 select 옵션 → 동기 array 필요 → await.
  // ActivityType / ActivityItem 합쳐서 10개 미만이라 await 비용 미미.
  // availableYears: 데이터에 존재하는 연도 목록 (FilterBar 연도 select)
  const [activityTypes, activityItems, allDates] = await Promise.all([
    prisma.activityType.findMany({ orderBy: { scope: "asc" } }),
    prisma.activityItem.findMany({ orderBy: { name: "asc" } }),
    prisma.activity.findMany({
      select: { date: true },
      orderBy: { date: "desc" },
    }),
  ]);
  const availableYears = Array.from(
    new Set(allDates.map((a) => a.date.getFullYear())),
  ).sort((a, b) => b - a); // 최신 연도 먼저

  // 데이터 promise는 await 없이 시작 → 자식이 use()로 받음 (parallel + streaming).
  // 필터(where)는 activities에만 적용. factors는 시점 매칭용이라 필터 무관.
  const activitiesPromise = prisma.activity.findMany({
    where,
    include: { item: { include: { type: true } } },
    orderBy: { date: "asc" },
  });
  const factorsPromise = prisma.emissionFactor.findMany({
    orderBy: [{ itemId: "asc" }, { validFrom: "asc" }],
  });

  return (
    <main className="container mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DashboardHeader />
        <DashboardActions
          activityItems={activityItems}
          activityTypes={activityTypes}
        />
      </div>
      <FilterBar
        activityTypes={activityTypes}
        availableYears={availableYears}
      />

      <SectionBoundary name="KPI" fallback={<KpiSkeleton />}>
        <KpiCardsSection
          activitiesPromise={activitiesPromise}
          factorsPromise={factorsPromise}
        />
      </SectionBoundary>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionBoundary name="Scope 분포" fallback={<ScopeChartSkeleton />}>
          <ScopeChartSection
            activitiesPromise={activitiesPromise}
            factorsPromise={factorsPromise}
          />
        </SectionBoundary>

        <SectionBoundary name="월별 추이" fallback={<MonthlyTrendSkeleton />}>
          <MonthlyTrendSection
            activitiesPromise={activitiesPromise}
            factorsPromise={factorsPromise}
          />
        </SectionBoundary>
      </div>

      <SectionBoundary name="Hotspot" fallback={<HotspotSkeleton />}>
        <HotspotSection
          activitiesPromise={activitiesPromise}
          factorsPromise={factorsPromise}
        />
      </SectionBoundary>

      <SectionBoundary name="활동 내역" fallback={<ActivityTableSkeleton />}>
        <ActivityTableSection
          activitiesPromise={activitiesPromise}
          factorsPromise={factorsPromise}
        />
      </SectionBoundary>
    </main>
  );
}
