/**
 * 월별 추이 차트의 Suspense fallback.
 * 차트 영역(h-72)과 같은 높이 → CLS 방지.
 */
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MonthlyTrendSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="flex h-72 items-center justify-center">
        <Skeleton className="h-48 w-full" />
      </CardContent>
    </Card>
  );
}
