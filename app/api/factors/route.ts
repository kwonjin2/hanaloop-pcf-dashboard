/**
 * 배출계수(EmissionFactor) GET 엔드포인트.
 *
 * 시점 매칭은 클라이언트의 lib/emissions.ts가 담당 (서버 라운드트립 절약).
 * 계수는 ~8개 규모라 전체 로드 후 메모리 매칭이 단순/빠름.
 * 정렬: itemId → validFrom 순. UI에서 항목별/시기별 표시할 때 유리.
 */
import { prisma } from "@/lib/prisma";

export async function GET() {
  const factors = await prisma.emissionFactor.findMany({
    orderBy: [{ itemId: "asc" }, { validFrom: "asc" }],
  });
  return Response.json(factors);
}
