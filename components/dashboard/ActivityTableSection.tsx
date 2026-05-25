"use client";

/**
 * 활동 테이블 섹션의 client wrapper.
 * ScopeChartSection과 동일 패턴.
 */
import { use } from "react";
import type { EmissionFactor } from "@/generated/prisma/client";
import type { ActivityWithRelations } from "@/lib/emissions";
import { ActivityTable } from "./ActivityTable";

type Props = {
  activitiesPromise: Promise<ActivityWithRelations[]>;
  factorsPromise: Promise<EmissionFactor[]>;
};

export function ActivityTableSection({
  activitiesPromise,
  factorsPromise,
}: Props) {
  const activities = use(activitiesPromise);
  const factors = use(factorsPromise);
  return <ActivityTable activities={activities} factors={factors} />;
}
