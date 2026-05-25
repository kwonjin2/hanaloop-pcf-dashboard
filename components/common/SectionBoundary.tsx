"use client";

/**
 * 섹션 단위 fault isolation wrapper.
 *
 * 대시보드의 핵심 UX 원칙: 한 섹션 실패가 다른 섹션을 막지 않음.
 *  - 로딩 중: Suspense가 fallback (Skeleton 등) 표시
 *  - 에러 발생: ErrorBoundary가 SectionError 표시
 *  - 다른 섹션은 영향 받지 않음 (선언적 부분 격리)
 *
 * 사용:
 *   <SectionBoundary name="KPI" fallback={<KpiSkeleton />}>
 *     <KpiCardsSection />
 *   </SectionBoundary>
 *
 * 순서가 중요: ErrorBoundary가 바깥, Suspense가 안쪽.
 *  - 데이터 fetch 에러는 Suspense 내부에서 throw됨
 *  - 그 에러를 잡으려면 ErrorBoundary가 Suspense를 감싸야 함
 */
import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { SectionError } from "./SectionError";

type Props = {
  name: string; // 에러 시 표시할 섹션 이름 (예: "KPI", "Scope 분포")
  fallback: ReactNode; // 로딩 중 표시할 placeholder
  children: ReactNode;
};

export function SectionBoundary({ name, fallback, children }: Props) {
  return (
    <ErrorBoundary fallback={<SectionError name={name} />}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
