/**
 * 대시보드 상단 KPI 카드 4개.
 *  - 총 배출량 (+ 계수 미정의 경고)
 *  - Scope 2 (전기)
 *  - Scope 3 (원소재 + 운송)
 *  - 전년 대비 변화율 (YoY)
 *
 * 순수 표현 컴포넌트: props만 받아 렌더 (데이터 페치는 KpiCardsSection).
 * "use client" 없음 → RSC compatible (이벤트/state 없음). 부모가 client면 client에서 렌더.
 *
 * 핵심: 모든 집계는 lib/emissions.ts 순수 함수 호출 — 비즈니스 로직 중복 0.
 * 탄소 도메인 컬러 시맨틱: 감소(아래 화살표) = 좋음(emerald), 증가(위 화살표) = 나쁨(red).
 */
import type { EmissionFactor } from "@/generated/prisma/client";
import {
  type ActivityWithRelations,
  totalEmission,
  emissionByScope,
  emissionByYear,
} from "@/lib/emissions";
import { formatEmission, formatNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Props = {
  activities: ActivityWithRelations[];
  factors: EmissionFactor[];
};

export function KpiCards({ activities, factors }: Props) {
  const { total, unmatchedCount } = totalEmission(activities, factors);
  const scopeData = emissionByScope(activities, factors);
  const yearly = emissionByYear(activities, factors);

  const scope2 = scopeData.find((s) => s.scope === 2)?.total ?? 0;
  const scope3 = scopeData.find((s) => s.scope === 3)?.total ?? 0;

  // 전년 대비 — 마지막 2개 연도 비교 (UI 레이어가 "current/previous" 정의)
  const current = yearly[yearly.length - 1];
  const previous = yearly[yearly.length - 2];
  const yoyPct =
    current && previous && previous.total > 0
      ? ((current.total - previous.total) / previous.total) * 100
      : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="총 배출량"
        value={formatEmission(total)}
        sublabel={
          unmatchedCount > 0
            ? `⚠️ 계수 미정의 ${unmatchedCount}건`
            : `${activities.length}건 집계`
        }
      />
      <KpiCard
        label="Scope 2 (전기)"
        value={formatEmission(scope2)}
        sublabel="구매 에너지로 인한 간접 배출"
      />
      <KpiCard
        label="Scope 3 (기타 간접)"
        value={formatEmission(scope3)}
        sublabel="원소재 + 운송"
      />
      <KpiCard
        label="전년 대비"
        value={
          yoyPct === null
            ? "—"
            : `${yoyPct >= 0 ? "+" : ""}${formatNumber(yoyPct, { maximumFractionDigits: 1 })}%`
        }
        sublabel={
          current && previous
            ? `${previous.year} → ${current.year}`
            : "비교 데이터 부족"
        }
        trendIcon={
          yoyPct === null ? (
            <Minus className="size-4 text-muted-foreground" />
          ) : yoyPct < 0 ? (
            <TrendingDown className="size-4 text-emerald-600" />
          ) : (
            <TrendingUp className="size-4 text-red-600" />
          )
        }
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sublabel,
  trendIcon,
}: {
  label: string;
  value: string;
  sublabel: string;
  trendIcon?: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
          {label}
          {trendIcon}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div>
      </CardContent>
    </Card>
  );
}
