"use client";

/**
 * Hotspot 바 차트 섹션의 client wrapper.
 * ScopeChartSection과 동일 패턴.
 */
import { use } from "react";
import type { EmissionFactor } from "@/generated/prisma/client";
import type { ActivityWithRelations } from "@/lib/emissions";
import { HotspotChart } from "./HotspotChart";

type Props = {
  activitiesPromise: Promise<ActivityWithRelations[]>;
  factorsPromise: Promise<EmissionFactor[]>;
};

export function HotspotSection({ activitiesPromise, factorsPromise }: Props) {
  const activities = use(activitiesPromise);
  const factors = use(factorsPromise);
  return <HotspotChart activities={activities} factors={factors} />;
}
