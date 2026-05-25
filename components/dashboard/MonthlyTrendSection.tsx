"use client";

/**
 * 월별 추이 라인 차트 섹션의 client wrapper.
 * ScopeChartSection과 동일 패턴 — promise prop을 use()로 resolve.
 */
import { use } from "react";
import type { EmissionFactor } from "@/generated/prisma/client";
import type { ActivityWithRelations } from "@/lib/emissions";
import { MonthlyTrend } from "./MonthlyTrend";

type Props = {
  activitiesPromise: Promise<ActivityWithRelations[]>;
  factorsPromise: Promise<EmissionFactor[]>;
};

export function MonthlyTrendSection({
  activitiesPromise,
  factorsPromise,
}: Props) {
  const activities = use(activitiesPromise);
  const factors = use(factorsPromise);
  return <MonthlyTrend activities={activities} factors={factors} />;
}
