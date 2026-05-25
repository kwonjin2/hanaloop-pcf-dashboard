/**
 * URL searchParams → Prisma where 빌더 테스트.
 *
 * 관대한 파싱: 잘못된 입력은 조건 미포함으로 처리 (빈 결과 ≠ 에러).
 */
import { describe, it, expect } from "vitest";
import { buildActivityWhere } from "./filters";

describe("buildActivityWhere", () => {
  describe("빈 필터 / 무효 입력", () => {
    it("모든 필드 없으면 빈 객체", () => {
      expect(buildActivityWhere({})).toEqual({});
    });

    it("Scope가 4 (GHG 범위 초과)면 무시", () => {
      expect(buildActivityWhere({ scope: "4" })).toEqual({});
    });

    it("Scope가 'abc' (비숫자)면 무시", () => {
      expect(buildActivityWhere({ scope: "abc" })).toEqual({});
    });

    it("잘못된 date 형식이면 무시", () => {
      expect(buildActivityWhere({ from: "invalid" })).toEqual({});
    });

    it("typeId가 음수/0이면 무시", () => {
      expect(buildActivityWhere({ typeId: "0" })).toEqual({});
      expect(buildActivityWhere({ typeId: "-1" })).toEqual({});
    });
  });

  describe("Scope 필터", () => {
    it("scope=2 → item.type.scope 조건", () => {
      expect(buildActivityWhere({ scope: "2" })).toEqual({
        item: { type: { scope: 2 } },
      });
    });
  });

  describe("typeId 필터", () => {
    it("typeId=1 → item.typeId 조건", () => {
      expect(buildActivityWhere({ typeId: "1" })).toEqual({
        item: { typeId: 1 },
      });
    });
  });

  describe("Scope + typeId 동시", () => {
    it("두 조건 한 item 객체로 병합", () => {
      expect(buildActivityWhere({ scope: "2", typeId: "1" })).toEqual({
        item: { type: { scope: 2 }, typeId: 1 },
      });
    });
  });

  describe("날짜 범위", () => {
    it("from + to 둘 다 → gte + lte", () => {
      const where = buildActivityWhere({
        from: "2024-01-01",
        to: "2024-12-31",
      });
      expect(where.date).toMatchObject({
        gte: new Date("2024-01-01"),
        lte: new Date("2024-12-31"),
      });
    });

    it("from만 → gte만", () => {
      const where = buildActivityWhere({ from: "2024-01-01" });
      expect(where.date).toMatchObject({ gte: new Date("2024-01-01") });
      expect(where.date).not.toHaveProperty("lte");
    });

    it("to만 → lte만", () => {
      const where = buildActivityWhere({ to: "2024-12-31" });
      expect(where.date).toMatchObject({ lte: new Date("2024-12-31") });
      expect(where.date).not.toHaveProperty("gte");
    });
  });

  describe("복합 필터", () => {
    it("scope + 날짜 범위", () => {
      const where = buildActivityWhere({
        scope: "3",
        from: "2024-01-01",
        to: "2024-06-30",
      });
      expect(where).toEqual({
        item: { type: { scope: 3 } },
        date: {
          gte: new Date("2024-01-01"),
          lte: new Date("2024-06-30"),
        },
      });
    });
  });
});
