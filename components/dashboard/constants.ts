/**
 * 대시보드 공유 상수.
 *
 * Scope 색상은 Okabe-Ito 팔레트 (색맹 친화 학술 표준).
 * 화면 전체에 일관 적용 → 사용자 멘탈 모델 형성 ("Scope 2는 항상 파랑").
 */
export const SCOPE_COLORS: Record<number, string> = {
  1: "#E69F00", // Orange (우리 데이터엔 없지만 확장성 대비)
  2: "#56B4E9", // Sky blue
  3: "#009E73", // Bluish green
};

export const SCOPE_LABELS: Record<number, string> = {
  1: "Scope 1 (직접 배출)",
  2: "Scope 2 (구매 에너지)",
  3: "Scope 3 (기타 간접)",
};

// 단일 색 차트용 (Hotspot 바, 월별 라인)
export const HOTSPOT_COLOR = "#0EA5E9"; // sky-500
export const TREND_COLOR = "#10B981"; // emerald-500
