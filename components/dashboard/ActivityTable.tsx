/**
 * 활동 내역 테이블 — 시점 매칭 demo의 시각적 증거.
 *
 * 책임: 각 활동에 대해 calcActivityEmission 호출 → 적용된 계수와 배출량 함께 표시.
 *  - "적용 계수" 컬럼: 같은 항목이라도 활동 일자에 따라 다른 계수 적용됨이 보임
 *  - 발표 무기: 시점 기반 계수 매칭이 실제로 작동함을 한 화면에서 증명
 *
 * 행이 많을 수 있어 가로 스크롤 (overflow-x-auto)으로 작은 화면 대응.
 */
import type { EmissionFactor } from "@/generated/prisma/client";
import {
  type ActivityWithRelations,
  calcActivityEmission,
} from "@/lib/emissions";
import { formatAmount, formatDate, formatEmission } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteActivityButton } from "./DeleteActivityButton";

type Props = {
  activities: ActivityWithRelations[];
  factors: EmissionFactor[];
};

export function ActivityTable({ activities, factors }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">활동 내역</CardTitle>
        <CardDescription>
          활동 일자에 따라 적용된 시점 계수와 계산된 배출량을 확인할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyMessage />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>일자</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>항목</TableHead>
                  <TableHead className="text-right">활동량</TableHead>
                  <TableHead className="text-right">적용 계수</TableHead>
                  <TableHead className="text-right">배출량</TableHead>
                  <TableHead className="w-12" aria-label="작업" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => {
                  const { value, factor } = calcActivityEmission(
                    activity,
                    factors,
                  );
                  const label = `${formatDate(activity.date)} · ${activity.item.name} · ${formatAmount(activity.amount, activity.item.unit)}`;
                  return (
                    <TableRow key={activity.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(activity.date)}
                      </TableCell>
                      <TableCell>
                        Scope {activity.item.type.scope}
                      </TableCell>
                      <TableCell>{activity.item.name}</TableCell>
                      <TableCell className="text-right">
                        {formatAmount(activity.amount, activity.item.unit)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {factor ? factor.value : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {factor ? formatEmission(value) : "계수 미정의"}
                      </TableCell>
                      <TableCell>
                        <DeleteActivityButton id={activity.id} label={label} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyMessage() {
  return (
    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
      활동 데이터가 없습니다
    </div>
  );
}
