/**
 * 배출량 계산 도메인 로직 테스트.
 *
 * 전략: 실제 시드와 같은 모양의 fixture로 검증 → 도메인 시나리오 그대로 테스트.
 * 부동소수점 비교는 toBeCloseTo 사용 (0.469 같은 값은 IEEE 754 부정확).
 */
import { describe, it, expect } from "vitest";
import type { Activity, EmissionFactor } from "@/generated/prisma/client";
import {
  type ActivityWithRelations,
  findFactor,
  calcActivityEmission,
  totalEmission,
  emissionByScope,
  emissionByMonth,
  emissionByItem,
  emissionByYear,
} from "./emissions";

// ── Fixtures: 시드와 동일한 도메인 모양 ──
// 한국전력 (Scope 2 / 전기)
const KEPCO_ID = 1;
const PLASTIC1_ID = 2;
const TRUCK_ID = 3;

// 계수: 2024 (validTo 있음) / 2025 (validTo null = 현재까지)
const factors: EmissionFactor[] = [
  {
    id: 1,
    itemId: KEPCO_ID,
    value: 0.469,
    validFrom: new Date("2024-01-01"),
    validTo: new Date("2024-12-31"),
    createdAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    itemId: KEPCO_ID,
    value: 0.456,
    validFrom: new Date("2025-01-01"),
    validTo: null,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 3,
    itemId: PLASTIC1_ID,
    value: 2.4,
    validFrom: new Date("2024-01-01"),
    validTo: new Date("2024-12-31"),
    createdAt: new Date("2024-01-01"),
  },
  {
    id: 4,
    itemId: TRUCK_ID,
    value: 3.6,
    validFrom: new Date("2024-01-01"),
    validTo: new Date("2024-12-31"),
    createdAt: new Date("2024-01-01"),
  },
];

// 조인된 활동 헬퍼 — Prisma include 결과 흉내
function makeActivity(
  date: string,
  amount: number,
  itemId: number,
  itemName: string,
  unit: string,
  typeName: string,
  scope: number,
): ActivityWithRelations {
  return {
    id: 0,
    date: new Date(date),
    amount,
    itemId,
    createdAt: new Date(),
    updatedAt: new Date(),
    item: {
      id: itemId,
      name: itemName,
      unit,
      typeId: scope,
      type: { id: scope, name: typeName, scope },
    },
  };
}

// ───────────────────────────────────────────────────────────────
// findFactor — 시점 기반 매칭 (핵심)
// ───────────────────────────────────────────────────────────────
describe("findFactor (시점 기반 계수 매칭)", () => {
  it("validFrom과 validTo 사이 → 매칭", () => {
    const result = findFactor(factors, KEPCO_ID, new Date("2024-06-15"));
    expect(result?.value).toBe(0.469);
  });

  it("validFrom 당일 → 매칭 (경계 inclusive)", () => {
    const result = findFactor(factors, KEPCO_ID, new Date("2024-01-01"));
    expect(result?.value).toBe(0.469);
  });

  it("validTo 당일 → 매칭 (경계 inclusive)", () => {
    const result = findFactor(factors, KEPCO_ID, new Date("2024-12-31"));
    expect(result?.value).toBe(0.469);
  });

  it("validTo 다음 날 → 다음 버전 매칭", () => {
    const result = findFactor(factors, KEPCO_ID, new Date("2025-01-01"));
    expect(result?.value).toBe(0.456);
  });

  it("validTo가 null (열린 범위) → 먼 미래도 매칭", () => {
    const result = findFactor(factors, KEPCO_ID, new Date("2099-01-01"));
    expect(result?.value).toBe(0.456);
  });

  it("validFrom 이전 → 매칭 없음 (null)", () => {
    const result = findFactor(factors, KEPCO_ID, new Date("2020-01-01"));
    expect(result).toBeNull();
  });

  it("존재하지 않는 itemId → null", () => {
    const result = findFactor(factors, 999, new Date("2024-06-15"));
    expect(result).toBeNull();
  });
});

// ───────────────────────────────────────────────────────────────
// calcActivityEmission — 활동 1건
// ───────────────────────────────────────────────────────────────
describe("calcActivityEmission", () => {
  it("정상: amount × factor.value", () => {
    const activity: Activity = {
      id: 1,
      date: new Date("2024-01-01"),
      amount: 110,
      itemId: KEPCO_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = calcActivityEmission(activity, factors);
    expect(result.value).toBeCloseTo(51.59, 2); // 110 × 0.469
    expect(result.factor?.value).toBe(0.469);
  });

  it("매칭 실패 → value 0, factor null (silent failure 방지)", () => {
    const activity: Activity = {
      id: 1,
      date: new Date("2020-01-01"),
      amount: 110,
      itemId: KEPCO_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = calcActivityEmission(activity, factors);
    expect(result.value).toBe(0);
    expect(result.factor).toBeNull();
  });
});

// ───────────────────────────────────────────────────────────────
// totalEmission — KPI 총합
// ───────────────────────────────────────────────────────────────
describe("totalEmission", () => {
  it("빈 배열 → 0", () => {
    expect(totalEmission([], factors)).toEqual({ total: 0, unmatchedCount: 0 });
  });

  it("모두 매칭 → 합계 정확", () => {
    const activities: Activity[] = [
      {
        id: 1,
        date: new Date("2024-01-01"),
        amount: 100,
        itemId: KEPCO_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        date: new Date("2024-02-01"),
        amount: 100,
        itemId: PLASTIC1_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const { total, unmatchedCount } = totalEmission(activities, factors);
    expect(total).toBeCloseTo(100 * 0.469 + 100 * 2.4, 2);
    expect(unmatchedCount).toBe(0);
  });

  it("일부 미매칭 → 미매칭 카운트 정확", () => {
    const activities: Activity[] = [
      {
        id: 1,
        date: new Date("2024-01-01"),
        amount: 100,
        itemId: KEPCO_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        date: new Date("2020-01-01"), // 계수 없음
        amount: 100,
        itemId: KEPCO_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const { total, unmatchedCount } = totalEmission(activities, factors);
    expect(total).toBeCloseTo(46.9, 2);
    expect(unmatchedCount).toBe(1);
  });
});

// ───────────────────────────────────────────────────────────────
// emissionByScope — 도넛 차트
// ───────────────────────────────────────────────────────────────
describe("emissionByScope", () => {
  it("Scope별 그룹핑 + 오름차순 정렬", () => {
    const activities = [
      makeActivity("2024-01-01", 100, KEPCO_ID, "한국전력", "kWh", "전기", 2),
      makeActivity(
        "2024-01-01",
        100,
        PLASTIC1_ID,
        "플라스틱 1",
        "kg",
        "원소재",
        3,
      ),
      makeActivity("2024-02-01", 50, KEPCO_ID, "한국전력", "kWh", "전기", 2),
    ];
    const result = emissionByScope(activities, factors);
    expect(result).toHaveLength(2);
    expect(result[0].scope).toBe(2); // 오름차순
    expect(result[0].total).toBeCloseTo(150 * 0.469, 2);
    expect(result[1].scope).toBe(3);
    expect(result[1].total).toBeCloseTo(100 * 2.4, 2);
  });

  it("빈 입력 → 빈 배열", () => {
    expect(emissionByScope([], factors)).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────
// emissionByMonth — 라인 차트
// ───────────────────────────────────────────────────────────────
describe("emissionByMonth", () => {
  it("같은 월 여러 활동 → 합산, 시계열 정렬", () => {
    const activities: Activity[] = [
      {
        id: 1,
        date: new Date("2024-02-01"),
        amount: 100,
        itemId: KEPCO_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        date: new Date("2024-01-01"),
        amount: 100,
        itemId: KEPCO_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        date: new Date("2024-01-15"),
        amount: 50,
        itemId: KEPCO_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const result = emissionByMonth(activities, factors);
    expect(result).toEqual([
      { yearMonth: "2024-01", total: 150 * 0.469 },
      { yearMonth: "2024-02", total: 100 * 0.469 },
    ]);
  });

  it("빈 입력 → 빈 배열", () => {
    expect(emissionByMonth([], factors)).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────
// emissionByItem — Hotspot 바 차트
// ───────────────────────────────────────────────────────────────
describe("emissionByItem", () => {
  it("항목별 합산 + 내림차순 정렬 (Hotspot)", () => {
    const activities = [
      makeActivity("2024-01-01", 100, KEPCO_ID, "한국전력", "kWh", "전기", 2),
      makeActivity(
        "2024-01-01",
        500,
        PLASTIC1_ID,
        "플라스틱 1",
        "kg",
        "원소재",
        3,
      ),
      makeActivity("2024-02-01", 50, TRUCK_ID, "트럭", "ton-km", "운송", 3),
    ];
    const result = emissionByItem(activities, factors);
    expect(result[0].itemName).toBe("플라스틱 1"); // 500*2.4 = 1200 (최대)
    expect(result[1].itemName).toBe("트럭"); // 50*3.6 = 180
    expect(result[2].itemName).toBe("한국전력"); // 100*0.469 = 46.9
  });
});

// ───────────────────────────────────────────────────────────────
// emissionByYear — 전년 대비 KPI 기초
// ───────────────────────────────────────────────────────────────
describe("emissionByYear", () => {
  it("연도별 그룹핑 + 오름차순", () => {
    const activities: Activity[] = [
      {
        id: 1,
        date: new Date("2025-01-01"),
        amount: 100,
        itemId: KEPCO_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        date: new Date("2024-06-01"),
        amount: 100,
        itemId: KEPCO_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const result = emissionByYear(activities, factors);
    expect(result).toEqual([
      { year: 2024, total: 100 * 0.469 },
      { year: 2025, total: 100 * 0.456 }, // 2025 계수 적용된 것 확인
    ]);
  });
});
