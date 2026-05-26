/**
 * 대시보드 상단 헤더 — 제목 + onboarding 한 줄.
 *
 * 도메인 용어(PCF, Scope, 배출계수)에 hover tooltip → 비전문가 즉시 학습 가능.
 *
 * "use client" — TermTooltip이 Radix Tooltip(client) 기반.
 * 단순 컴포넌트지만 tooltip 포함하려면 client.
 */
"use client";
import { TermTooltip } from "@/components/common/TermTooltip";

export function DashboardHeader() {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">
        제품 탄소발자국 대시보드
      </h1>
      <p className="text-sm text-muted-foreground">
        월별 활동 데이터로{" "}
        <TermTooltip term="scope1">Scope 1</TermTooltip>/
        <TermTooltip term="scope2">Scope 2</TermTooltip>/
        <TermTooltip term="scope3">Scope 3</TermTooltip> 배출량을 통합
        추적합니다. 활동 일자에 따라 적절한 시점의{" "}
        <TermTooltip term="emissionFactor">배출계수</TermTooltip>가 자동
        적용됩니다.
      </p>
    </header>
  );
}
