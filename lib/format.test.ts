import { describe, it, expect } from "vitest";
import { formatDate, formatEmission, formatYearMonth } from "./format";

describe("formatEmission", () => {
  it("배출량을 kgCO2e + 천 단위 + 소수 2자리로 표시", () => {
    expect(formatEmission(1234.567)).toBe("1,234.57 kgCO₂e");
  });

  it("0도 단위와 함께 정상 표시", () => {
    expect(formatEmission(0)).toBe("0.00 kgCO₂e");
  });
});

describe("formatDate", () => {
  it("로컬 timezone 기준으로 YYYY-MM-DD 반환 (UTC 변환 버그 방지)", () => {
    const date = new Date(2025, 0, 15);
    expect(formatDate(date)).toBe("2025-01-15");
  });

  it("ISO string 입력도 처리", () => {
    expect(formatDate("2025-05-01")).toBe("2025-05-01");
  });
});

describe("formatYearMonth", () => {
  it('한국어 "YYYY년 MM월" 포맷', () => {
    expect(formatYearMonth(new Date(2025, 4, 1))).toBe("2025년 05월");
  });
});
