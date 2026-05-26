/**
 * Hotspot — 항목별 배출 Top (수평 바 차트).
 *
 * Pareto 원칙(80/20): 가장 큰 배출원이 한눈에 → 감축 우선순위.
 * emissionByItem이 내림차순 정렬해서 반환 → 그대로 표시.
 *
 * 수평 바 (layout="vertical" = Y가 카테고리 축):
 *  - 항목명이 한국어라 가로 라벨이 읽기 좋음
 *  - 4개 정도라 수직 공간 충분
 */
import type { EmissionFactor } from "@/generated/prisma/client";
import {
  type ActivityWithRelations,
  emissionByItem,
} from "@/lib/emissions";
import { formatEmission, formatNumber } from "@/lib/format";
import { HOTSPOT_COLOR } from "./constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TermTooltip } from "@/components/common/TermTooltip";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  activities: ActivityWithRelations[];
  factors: EmissionFactor[];
};

export function HotspotChart({ activities, factors }: Props) {
  const data = emissionByItem(activities, factors);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1 text-base">
          <TermTooltip term="hotspot">Hotspot</TermTooltip>
          <span>— 항목별 배출 Top</span>
        </CardTitle>
        <CardDescription>가장 큰 배출원부터 — 감축 우선순위</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <EmptyMessage />
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 500, height: 280 }}
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={(v) =>
                  formatNumber(Number(v), { maximumFractionDigits: 0 })
                }
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="itemName"
                tick={{ fontSize: 11 }}
                width={90}
              />
              <Tooltip formatter={(v) => formatEmission(Number(v))} />
              <Bar dataKey="total" fill={HOTSPOT_COLOR} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyMessage() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      표시할 데이터가 없습니다
    </div>
  );
}
