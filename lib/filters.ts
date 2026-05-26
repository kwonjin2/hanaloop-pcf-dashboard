/**
 * URL searchParams → Prisma where 절 빌더.
 *
 * Next.js 16 best practice: 필터링은 searchParams prop으로 (RSC가 받아 DB 쿼리).
 * URL = single source of truth → 새로고침/공유/뒤로가기 자연 작동, 외부 상태 라이브러리 불필요.
 *
 * 모든 필드 optional. 빈 값/잘못된 형식은 조건 미포함 (관대한 파싱).
 * 잘못된 입력으로 빈 결과가 나오는 게 500 에러보다 UX 좋음.
 */
import { Prisma } from "@/generated/prisma/client";

export type ActivityFilters = {
  year?: string; // "2024" | "2025" | "all" | undefined (undefined → page에서 latestYear default 적용)
  scope?: string;
  typeId?: string;
  from?: string; // YYYY-MM-DD (year 없을 때만 적용)
  to?: string;
};

/** "전체 기간" 명시 sentinel — 다년 누적 보기 */
export const YEAR_ALL = "all";

export function buildActivityWhere(
  filters: ActivityFilters,
): Prisma.ActivityWhereInput {
  const where: Prisma.ActivityWhereInput = {};

  // item 관계 조건 (scope/typeId 모두 item으로 접근 → 한 객체로 합침)
  const scope = parseScope(filters.scope);
  const typeId = parsePositiveInt(filters.typeId);
  if (scope !== null || typeId !== null) {
    where.item = {
      ...(scope !== null && { type: { scope } }),
      ...(typeId !== null && { typeId }),
    };
  }

  // 날짜 처리 우선순위: year > from/to
  // - year=숫자: 그 연도 1/1~12/31
  // - year="all": date 필터 미적용 (전체 기간)
  // - year 없음: from/to 폴백
  if (filters.year === YEAR_ALL) {
    // 명시적 전체 — date 필터 추가 안 함
  } else {
    const year = parsePositiveInt(filters.year);
    if (year !== null && year >= 1900 && year <= 2100) {
      where.date = {
        gte: new Date(`${year}-01-01T00:00:00`),
        lte: new Date(`${year}-12-31T23:59:59.999`),
      };
    } else {
      // year 무효 → from/to 폴백
      const from = parseDate(filters.from);
      const to = parseDate(filters.to);
      if (from || to) {
        where.date = {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        };
      }
    }
  }

  return where;
}

/** GHG Protocol Scope는 1, 2, 3만 유효 */
function parseScope(value?: string): number | null {
  const n = parsePositiveInt(value);
  if (n === null) return null;
  if (n < 1 || n > 3) return null;
  return n;
}

function parsePositiveInt(value?: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
