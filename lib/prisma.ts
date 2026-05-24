import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma Client singleton.
 *
 * Next.js dev 환경에서 hot reload마다 새 인스턴스 생성을 방지.
 * production에선 매 요청마다 새로 만들지 않고 모듈 캐시 활용
 */

// globalThis에 임시 슬롯 - TS가 unknown으로 인식하므로 cast
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Postgres driver adapter - Prisma 7부터 필수
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// 이미 globalThis에 있으면 재사용, 없으면 새로 생성
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// 개발 환경에서만 globalThis에 캐싱 (production은 모듈 캐시로 충분)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
