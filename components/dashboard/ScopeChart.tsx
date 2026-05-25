/**
 * Scope별 배출 비중 도넛 차트 — 순수 표현 컴포넌트.
 *
 * 책임: emissionByScope 호출 + Recharts 렌더.
 * Okabe-Ito 색상 (SCOPE_COLORS), 라벨은 SCOPE_LABELS.
 * 빈 데이터 시 EmptyState 메시지 (KpiCards처럼 0으로 표시하면 의도 불명).
 *
 * "use client" 없음 — props만 받는 순수 컴포넌트. 부모가 client라 client에서 렌더.
 */
import type { EmissionFactor } from "@/generated/prisma/client";
import { type ActivityWithRelations, emissionByScope } from "@/lib/emissions";
import { formatEmission } from "@/lib/format";
import { SCOPE_COLORS, SCOPE_LABELS } from "./constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Props = {
  activities: ActivityWithRelations[];
  factors: EmissionFactor[];
};

export function ScopeChart({ activities, factors }: Props) {
  const rawData = emissionByScope(activities, factors);
  // ESG 표준: 모든 Scope(1, 2, 3) 명시 포함 (데이터 없으면 0).
  // KPI 카드와 일관성 유지. 0% slice는 Recharts가 자동으로 안 그리고, Legend에는 표시됨.
  const data = [1, 2, 3].map((scope) => ({
    scope,
    total: rawData.find((d) => d.scope === scope)?.total ?? 0,
  }));
  const hasData = data.some((d) => d.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Scope별 비중</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {!hasData ? (
          <EmptyMessage />
        ) : (
          // initialDimension: 첫 렌더 시 sizes 기본값 (-1, -1) → width=-1 경고 회피.
          // useEffect에서 ResizeObserver가 실제 측정값으로 자동 갱신.
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 500, height: 280 }}
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="scope"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                // percent는 Recharts 자동 계산 (0~1). 0%는 의미 없는 노이즈라 생략.
                label={(props: { percent?: number }) => {
                  const pct = (props.percent ?? 0) * 100;
                  if (pct === 0) return null;
                  return `${pct.toFixed(1)}%`;
                }}
                labelLine={false}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.scope}
                    fill={SCOPE_COLORS[entry.scope] ?? "#cccccc"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatEmission(Number(value))}
                labelFormatter={(label) =>
                  SCOPE_LABELS[Number(label)] ?? `Scope ${label}`
                }
              />
              <Legend
                formatter={(value) =>
                  SCOPE_LABELS[Number(value)] ?? `Scope ${value}`
                }
              />
            </PieChart>
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
