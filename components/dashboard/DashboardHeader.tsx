/**
 * 대시보드 상단 헤더 — 제목 + onboarding 한 줄.
 *
 * RSC: 정적 컨텐츠라 서버에서 즉시 렌더 + 클라이언트 번들에서 제외.
 * 하이드레이션 비용 0.
 */
export function DashboardHeader() {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">
        제품 탄소발자국 대시보드
      </h1>
      <p className="text-sm text-muted-foreground">
        월별 활동 데이터로 Scope 2/3 배출량을 추적합니다. 활동 일자에 따라
        적절한 시점의 배출계수가 자동 적용됩니다.
      </p>
    </header>
  );
}
