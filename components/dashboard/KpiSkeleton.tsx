/**
 * KPI 섹션의 Suspense fallback.
 *
 * 실제 KpiCards와 같은 그리드/높이 → 레이아웃 시프트(CLS) 방지.
 * 4개 placeholder는 데스크탑/태블릿/모바일 break에 맞춰 그리드 적응.
 */
import { Skeleton } from "@/components/ui/skeleton";

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  );
}
