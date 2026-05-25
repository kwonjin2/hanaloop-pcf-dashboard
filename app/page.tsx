"use client";

/**
 * 대시보드 메인 페이지.
 *
 * 구조:
 *  1. 헤더 (제목 + onboarding 한 줄)
 *  2. KPI 카드 4개
 *  3. 차트 영역 (2b 단계에서 추가)
 *  4. 활동 테이블 (2b 단계에서 추가)
 *
 * 데이터 흐름:
 *  - 페이지가 useActivities/useFactors 한 번씩만 호출
 *  - 받은 데이터를 하위 컴포넌트에 props로 전달
 *  - 각 컴포넌트는 emissions.ts 순수 함수로 자기 view에 필요한 집계만 수행
 */
import { useActivities } from "@/hooks/use-activities";
import { useFactors } from "@/hooks/use-factors";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const activitiesQuery = useActivities();
  const factorsQuery = useFactors();

  const isLoading = activitiesQuery.isLoading || factorsQuery.isLoading;
  const isError = activitiesQuery.isError || factorsQuery.isError;
  const activities = activitiesQuery.data ?? [];
  const factors = factorsQuery.data ?? [];

  return (
    <main className="container mx-auto max-w-7xl space-y-6 p-6">
      <DashboardHeader />

      {isLoading ? (
        <KpiSkeleton />
      ) : isError ? (
        <ErrorBanner
          message={
            activitiesQuery.error?.message ??
            factorsQuery.error?.message ??
            "데이터 조회 실패"
          }
        />
      ) : (
        <KpiCards activities={activities} factors={factors} />
      )}

      {/* 2b 단계: 차트 3종 + 활동 테이블 */}
    </main>
  );
}

function DashboardHeader() {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">
        제품 탄소발자국 대시보드
      </h1>
      <p className="text-sm text-muted-foreground">
        월별 활동 데이터로 Scope 2/3 배출량을 추적합니다. 활동 일자에 따라 적절한 시점의 배출계수가 자동 적용됩니다.
      </p>
    </header>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-medium">데이터를 불러올 수 없습니다</p>
      <p className="mt-1 text-xs">{message}</p>
      <p className="mt-2 text-xs text-red-600">
        Docker가 떠 있는지(`docker compose up -d`)와 시드 실행
        여부(`yarn prisma db seed`)를 확인해주세요.
      </p>
    </div>
  );
}
