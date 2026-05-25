/**
 * 배출량 계산 도메인 로직.
 *
 * 본 모듈은 순수 함수만 노출 — Prisma client를 직접 import하지 않음.
 *  - 테스트가 DB 없이 가능
 *  - 서버/클라이언트 어디서나 호출 가능
 *  - 단일 책임: "계산"만 담당. 데이터 로딩은 호출자(API route 등) 책임
 *
 * 계산 공식: 활동량(amount) × 배출계수(value) = kgCO₂e
 * 핵심 제약: 활동 일자(date)에 유효한 계수 버전을 사용해야 함 (시점 기반 매칭)
 */
import type {
  Activity,
  ActivityItem,
  ActivityType,
  EmissionFactor,
} from "@/generated/prisma/client";

/**
 * Prisma `include: { item: { include: { type: true } } }` 로 조인된 활동.
 * Scope/항목명/단위까지 한 객체로 접근 가능 → 집계 함수가 깔끔해짐.
 */
export type ActivityWithRelations = Activity & {
  item: ActivityItem & { type: ActivityType };
};

// ───────────────────────────────────────────────────────────────
// Level 1: 가장 작은 계산 (한 활동)
// ───────────────────────────────────────────────────────────────

/**
 * 시점 기반 계수 매칭 — 도메인의 핵심 규칙.
 *
 * 규칙: validFrom <= date <= validTo (validTo가 null이면 "현재까지 유효")
 * 가정: 같은 itemId+시점에 매칭되는 계수는 정확히 1개 (입력 단계에서 보장).
 *      충돌 시 .find()가 첫 번째를 반환 — 데이터 정합성은 입력 검증에서 잡음.
 */
export function findFactor(
  factors: EmissionFactor[],
  itemId: number,
  date: Date,
): EmissionFactor | null {
  const match = factors.find((f) => {
    // 1. 같은 항목인가
    if (f.itemId !== itemId) return false;
    // 2. validFrom 이후인가 (당일 포함 → <=)
    if (f.validFrom > date) return false;
    // 3. validTo 이전인가 (null이면 무제한, 당일 포함 → >=)
    if (f.validTo !== null && f.validTo < date) return false;
    return true;
  });
  return match ?? null;
}

/**
 * 활동 1건의 배출량.
 *
 * 반환값에 factor를 함께 포함하는 이유:
 *  - UI 테이블이 "적용된 계수 = X" 컬럼을 보여줄 수 있음
 *  - 발표 시 "시점 매칭이 진짜 작동함"의 시각적 증거가 됨
 *  - 계수 미매칭 시 null로 명시적 처리 (조용히 0을 반환하면 데이터 문제가 숨음)
 */
export function calcActivityEmission(
  activity: Activity,
  factors: EmissionFactor[],
): { value: number; factor: EmissionFactor | null } {
  const factor = findFactor(factors, activity.itemId, activity.date);
  if (!factor) return { value: 0, factor: null };
  return { value: activity.amount * factor.value, factor };
}

// ───────────────────────────────────────────────────────────────
// Level 2: 집계 (여러 활동을 묶어서)
// ───────────────────────────────────────────────────────────────

/**
 * 총 배출량 KPI.
 *
 * unmatchedCount를 함께 반환 → UI에서 "⚠️ 계수 미정의 N건" 경고 가능.
 * 침묵 실패 방지 (silent failure는 PCF 같은 보고 도메인에서 치명적).
 */
export function totalEmission(
  activities: Activity[],
  factors: EmissionFactor[],
): { total: number; unmatchedCount: number } {
  let total = 0;
  let unmatchedCount = 0;
  for (const activity of activities) {
    const { value, factor } = calcActivityEmission(activity, factors);
    total += value;
    if (factor === null) unmatchedCount++;
  }
  return { total, unmatchedCount };
}

/**
 * Scope별 그룹핑 → 도넛 차트용.
 *
 * scope 오름차순 정렬 (Scope 1, 2, 3 순) — 차트 색상/범례 일관성.
 * 빈 배열 입력 시 빈 배열 반환 — UI에서 EmptyState 처리.
 */
export function emissionByScope(
  activities: ActivityWithRelations[],
  factors: EmissionFactor[],
): { scope: number; total: number }[] {
  const bucket = new Map<number, number>();
  for (const activity of activities) {
    const { value } = calcActivityEmission(activity, factors);
    const scope = activity.item.type.scope;
    bucket.set(scope, (bucket.get(scope) ?? 0) + value);
  }
  return Array.from(bucket.entries())
    .map(([scope, total]) => ({ scope, total }))
    .sort((a, b) => a.scope - b.scope);
}

/**
 * 월별 그룹핑 → 라인 차트용.
 *
 * yearMonth는 "YYYY-MM" 문자열 — localeCompare로 정확한 시계열 정렬.
 * Date 비교가 아닌 문자열 비교를 쓰는 이유: 정렬 키와 그룹핑 키가 동일해서 단순.
 * UI 표시는 lib/format.ts의 formatYearMonth로 변환.
 */
export function emissionByMonth(
  activities: Activity[],
  factors: EmissionFactor[],
): { yearMonth: string; total: number }[] {
  const bucket = new Map<string, number>();
  for (const activity of activities) {
    const { value } = calcActivityEmission(activity, factors);
    const y = activity.date.getFullYear();
    const m = (activity.date.getMonth() + 1).toString().padStart(2, "0");
    const key = `${y}-${m}`;
    bucket.set(key, (bucket.get(key) ?? 0) + value);
  }
  return Array.from(bucket.entries())
    .map(([yearMonth, total]) => ({ yearMonth, total }))
    .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

/**
 * 항목별 그룹핑 → Hotspot 바 차트용.
 *
 * total 내림차순 정렬 — Pareto 원칙 (80/20): "어디부터 줄여야 하는가"가 한눈에.
 * PCF 대시보드의 가장 액션 지향적 지표 — 의사결정을 직접 부르는 view.
 */
export function emissionByItem(
  activities: ActivityWithRelations[],
  factors: EmissionFactor[],
): { itemId: number; itemName: string; total: number }[] {
  const bucket = new Map<number, { name: string; total: number }>();
  for (const activity of activities) {
    const { value } = calcActivityEmission(activity, factors);
    const existing = bucket.get(activity.itemId);
    bucket.set(activity.itemId, {
      name: activity.item.name,
      total: (existing?.total ?? 0) + value,
    });
  }
  return Array.from(bucket.entries())
    .map(([itemId, { name, total }]) => ({ itemId, itemName: name, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * 연도별 그룹핑 → 전년 대비 KPI의 기초 데이터.
 *
 * 변화율 계산은 UI 레이어에 맡김 (단일 책임).
 * 우리 데이터는 2024(시드) vs 2025(임포트) — 시점 기반 계수 매칭의 자연스러운 demo.
 */
export function emissionByYear(
  activities: Activity[],
  factors: EmissionFactor[],
): { year: number; total: number }[] {
  const bucket = new Map<number, number>();
  for (const activity of activities) {
    const { value } = calcActivityEmission(activity, factors);
    const year = activity.date.getFullYear();
    bucket.set(year, (bucket.get(year) ?? 0) + value);
  }
  return Array.from(bucket.entries())
    .map(([year, total]) => ({ year, total }))
    .sort((a, b) => a.year - b.year);
}
