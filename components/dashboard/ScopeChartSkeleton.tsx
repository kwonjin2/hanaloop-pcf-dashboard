/**
 * Scope 도넛 차트의 Suspense fallback.
 * 실제 차트와 같은 카드 구조 + 도넛 모양 placeholder → CLS 방지.
 */
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ScopeChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent className="flex items-center justify-center py-8">
        <Skeleton className="h-44 w-44 rounded-full" />
      </CardContent>
    </Card>
  );
}
