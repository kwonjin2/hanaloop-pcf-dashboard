/**
 * 월별 배출 추이 라인 차트 — 순수 표현 컴포넌트.
 *
 * 책임: emissionByMonth 호출 + Recharts LineChart 렌더.
 * X축 라벨은 formatYearMonth로 한국어 ("2024년 01월").
 * 데이터 0건이면 EmptyMessage.
 */
import type { EmissionFactor } from "@/generated/prisma/client";
import {
  type ActivityWithRelations,
  emissionByMonth,
} from "@/lib/emissions";
import { formatEmission, formatNumber, formatYearMonth } from "@/lib/format";
import { TREND_COLOR } from "./constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  activities: ActivityWithRelations[];
  factors: EmissionFactor[];
};

export function MonthlyTrend({ activities, factors }: Props) {
  const raw = emissionByMonth(activities, factors);
  // X축 라벨 한국어로 — "2024-01" → "2024년 01월"
  const data = raw.map((d) => ({
    ...d,
    label: formatYearMonth(new Date(d.yearMonth + "-01")),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">월별 배출 추이</CardTitle>
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
            <LineChart
              data={data}
              margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v) =>
                  formatNumber(Number(v), { maximumFractionDigits: 0 })
                }
                tick={{ fontSize: 11 }}
                width={70}
              />
              <Tooltip formatter={(v) => formatEmission(Number(v))} />
              <Line
                type="monotone"
                dataKey="total"
                stroke={TREND_COLOR}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
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
