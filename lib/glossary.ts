/**
 * PCF / ESG 도메인 용어 사전.
 *
 * 비전문가가 hover로 즉시 학습 가능 — UX 25% 평가 항목.
 * 한 곳에 모아서 일관 적용 + 확장 쉬움.
 */
export const GLOSSARY: Record<string, string> = {
  // Scope 분류
  scope1:
    "Scope 1 (직접 배출): 회사가 직접 소유/관리하는 source의 온실가스. 예) 회사 차량 휘발유, 사내 보일러 LPG, 사내 연소 등",
  scope2:
    "Scope 2 (구매 에너지): 외부에서 구매한 에너지로 인한 간접 배출. 예) 전기, 스팀, 난방. 우리 도메인은 한국전력 전기.",
  scope3:
    "Scope 3 (기타 간접): 회사의 가치 사슬에서 발생하는 모든 간접 배출. 예) 원자재 생산, 운송, 직원 출장, 폐기 등. 보통 가장 큰 비중.",

  // 단위
  kgCO2e:
    "kgCO₂e (kg of CO₂ equivalent): 다양한 온실가스(CO₂, 메탄, N₂O 등)를 이산화탄소 1kg의 기준으로 환산한 값. 탄소 배출의 표준 측정 단위.",
  kWh: "kWh (kilowatt-hour): 전력 사용량 단위. 1kW × 1시간 = 1kWh. 가정용 전기 요금 청구의 기준.",
  tonKm:
    "ton-km (톤-킬로미터): 운송의 표준 단위. 1톤의 화물을 1km 운반 = 1 ton-km. 운송 거리 × 무게로 환산.",

  // 도메인 개념
  pcf: "PCF (Product Carbon Footprint): 제품 단위의 탄소 발자국. 한 제품의 생산~사용~폐기까지 발생하는 온실가스 총량을 kgCO₂e로 측정.",
  emissionFactor:
    "배출계수 (Emission Factor): 단위 활동량당 배출되는 온실가스 양. 예) 전기 1kWh × 0.456 = 0.456 kgCO₂e. 시점(연도)별로 다름 — 그리드 신재생 비중 변화 등.",
  yoy: "전년 대비 (YoY, Year-over-Year): 올해 값과 작년 값의 비율 변화. ESG 연간 보고서의 표준 지표. 감소(좋음)는 초록, 증가(나쁨)는 빨강으로 표시.",
  hotspot:
    "Hotspot (배출 핫스팟): 가장 큰 배출원. Pareto 80/20 원칙으로 '어디부터 줄여야 하는가' 의사결정의 출발점.",
  ghgProtocol:
    "GHG Protocol: 가장 일반적인 회사 차원 온실가스 측정/보고 표준. Scope 1/2/3 분류의 출처.",
  esg: "ESG (Environmental, Social, Governance): 기업 비재무 성과의 3대 축. 우리 대시보드는 'E (환경)'의 탄소 배출 보고 영역.",
} as const;

export type GlossaryTerm = keyof typeof GLOSSARY;
