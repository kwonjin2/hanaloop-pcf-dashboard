/**
 * 활동(Activity) GET 엔드포인트.
 *
 * Prisma include로 item.type까지 한 번에 조회 → ActivityWithRelations 모양.
 * UI는 단일 호출로 Scope/항목명/단위까지 접근 가능 (N+1 방지).
 * 정렬: 일자 오름차순 (월별 라인 차트가 시계열로 그려져야 함).
 */
import { prisma } from "@/lib/prisma";

export async function GET() {
  const activities = await prisma.activity.findMany({
    include: { item: { include: { type: true } } },
    orderBy: { date: "asc" },
  });
  return Response.json(activities);
}
