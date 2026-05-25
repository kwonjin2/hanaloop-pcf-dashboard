/**
 * 활동(Activity) 데이터 페칭 훅.
 *
 * JSON 직렬화 시 Date 필드가 ISO string으로 변환됨 → fetcher에서 Date로 복원.
 * (lib/emissions.ts의 함수들이 Date 객체를 기대하기 때문)
 */
import { useQuery } from "@tanstack/react-query";
import type { ActivityWithRelations } from "@/lib/emissions";

// API 응답: Date 필드가 모두 string으로 직렬화된 상태
type SerializedActivity = Omit<
  ActivityWithRelations,
  "date" | "createdAt" | "updatedAt"
> & {
  date: string;
  createdAt: string;
  updatedAt: string;
};

async function fetchActivities(): Promise<ActivityWithRelations[]> {
  const res = await fetch("/api/activities");
  if (!res.ok) throw new Error("활동 조회 실패");
  const data: SerializedActivity[] = await res.json();
  return data.map((a) => ({
    ...a,
    date: new Date(a.date),
    createdAt: new Date(a.createdAt),
    updatedAt: new Date(a.updatedAt),
  }));
}

export function useActivities() {
  return useQuery({ queryKey: ["activities"], queryFn: fetchActivities });
}
