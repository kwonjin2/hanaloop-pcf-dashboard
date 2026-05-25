"use client";

/**
 * Scope 도넛 차트 섹션의 client wrapper.
 * KpiCardsSection과 동일 패턴 — promise prop을 use()로 resolve.
 */
import { use } from "react";
import type { EmissionFactor } from "@/generated/prisma/client";
import type { ActivityWithRelations } from "@/lib/emissions";
import { ScopeChart } from "./ScopeChart";

type Props = {
  activitiesPromise: Promise<ActivityWithRelations[]>;
  factorsPromise: Promise<EmissionFactor[]>;
};

export function ScopeChartSection({
  activitiesPromise,
  factorsPromise,
}: Props) {
  const activities = use(activitiesPromise);
  const factors = use(factorsPromise);
  return <ScopeChart activities={activities} factors={factors} />;
}
