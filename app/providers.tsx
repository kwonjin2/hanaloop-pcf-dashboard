"use client";

/**
 * 클라이언트 전역 Provider 묶음.
 *  - QueryClient: useState로 인스턴스 안정화 (re-render마다 새로 만들면 캐시 손실)
 *  - Toaster: sonner 전역 마운트 — 활동 저장/삭제 등 mutation 피드백 채널
 *
 * 캐시 정책:
 *  - staleTime 60초: PCF 도메인은 데이터 변화 주기가 느림 → 불필요한 리페치 방지
 *  - refetchOnWindowFocus 비활성: 발표 demo 중 의도치 않은 깜빡임 방지
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
