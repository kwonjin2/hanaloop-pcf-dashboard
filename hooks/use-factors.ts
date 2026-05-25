/**
 * 배출계수(EmissionFactor) 데이터 페칭 훅.
 *
 * JSON 직렬화 시 Date 필드가 ISO string으로 변환됨 → fetcher에서 Date로 복원.
 * validTo는 null 가능 (현재까지 유효한 계수).
 */
import { useQuery } from "@tanstack/react-query";
import type { EmissionFactor } from "@/generated/prisma/client";

type SerializedFactor = Omit<
  EmissionFactor,
  "validFrom" | "validTo" | "createdAt"
> & {
  validFrom: string;
  validTo: string | null;
  createdAt: string;
};

async function fetchFactors(): Promise<EmissionFactor[]> {
  const res = await fetch("/api/factors");
  if (!res.ok) throw new Error("배출계수 조회 실패");
  const data: SerializedFactor[] = await res.json();
  return data.map((f) => ({
    ...f,
    validFrom: new Date(f.validFrom),
    validTo: f.validTo ? new Date(f.validTo) : null,
    createdAt: new Date(f.createdAt),
  }));
}

export function useFactors() {
  return useQuery({ queryKey: ["factors"], queryFn: fetchFactors });
}
