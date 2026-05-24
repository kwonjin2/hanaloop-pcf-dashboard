/**
 * 숫자/단위/날짜 포맷 유틸.
 * 모든 화면에서 일관된 표시를 위한 단일 진실 원천(SSOT).
 */

/**
 * 한국식 천 단위 구분 (1234567 → "1,234,567").
 * Intl.NumberFormat은 브라우저 표준이라 별도 라이브러리 불필요.
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat("ko-KR", options).format(value);
}

/**
 * 배출량을 kgCO₂e 단위로 표시. 소수 2자리 고정.
 * 명세 평가 항목 "단위 표시"와 직접 연결.
 */
export function formatEmission(value: number, decimals = 2): string {
  return `${formatNumber(value, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} kgCO₂e`;
}

/**
 * 활동량과 단위 결합 (예: 120 kWh, 230 kg).
 * decimals 기본 0 — 활동량은 통상 정수.
 */
export function formatAmount(
  value: number,
  unit: string,
  decimals = 0,
): string {
  return `${formatNumber(value, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${unit}`;
}

/**
 * Date 또는 ISO string을 YYYY-MM-DD로.
 * 로컬 timezone 기준 (UTC 변환으로 일자가 밀리는 버그 방지).
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 월별 트렌드 차트 X축용 (예: "2025년 05월").
 */
export function formatYearMonth(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${d.getFullYear()}년 ${month}월`;
}
