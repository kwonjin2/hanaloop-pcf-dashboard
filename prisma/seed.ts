/**
 * 시드 데이터.
 *
 * 전략: 2024년 historical 데이터로 시드 → 2025년 Excel 임포트로 신규 추가.
 *  - 시점 기반 계수 매칭의 실제 demo가 가능 (2024 활동은 2024 계수, 2025는 2025 계수)
 *  - Excel 임포트 시 중복 없이 30행 신규 추가됨
 *
 * 멱등성:
 *  - ActivityType/Item: unique name 있음 → upsert
 *  - EmissionFactor/Activity: unique 제약 없음 → deleteMany 후 createMany
 *
 * 실행: `yarn prisma db seed`
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 시드 시작...");

  // ── 1. 활동 유형 (Scope 분류) ──
  const electric = await prisma.activityType.upsert({
    where: { name: "전기" },
    update: {},
    create: { name: "전기", scope: 2 },
  });
  const material = await prisma.activityType.upsert({
    where: { name: "원소재" },
    update: {},
    create: { name: "원소재", scope: 3 },
  });
  const transport = await prisma.activityType.upsert({
    where: { name: "운송" },
    update: {},
    create: { name: "운송", scope: 3 },
  });

  // ── 2. 활동 항목 (운영 단위) ──
  const kepco = await prisma.activityItem.upsert({
    where: { name: "한국전력" },
    update: {},
    create: { name: "한국전력", unit: "kWh", typeId: electric.id },
  });
  const plastic1 = await prisma.activityItem.upsert({
    where: { name: "플라스틱 1" },
    update: {},
    create: { name: "플라스틱 1", unit: "kg", typeId: material.id },
  });
  const plastic2 = await prisma.activityItem.upsert({
    where: { name: "플라스틱 2" },
    update: {},
    create: { name: "플라스틱 2", unit: "kg", typeId: material.id },
  });
  const truck = await prisma.activityItem.upsert({
    where: { name: "트럭" },
    update: {},
    create: { name: "트럭", unit: "ton-km", typeId: transport.id },
  });

  // ── 3. 배출계수 (시점별 2개 버전: 2024 / 2025) ──
  // 2024 계수 → 2025 계수: 연간 ~2-3% 개선 추세 반영 (한국 전력망 탈탄소화 등)
  await prisma.emissionFactor.deleteMany({});
  await prisma.emissionFactor.createMany({
    data: [
      // 한국전력
      {
        itemId: kepco.id,
        value: 0.469,
        validFrom: new Date("2024-01-01"),
        validTo: new Date("2024-12-31"),
      },
      {
        itemId: kepco.id,
        value: 0.456,
        validFrom: new Date("2025-01-01"),
        validTo: null,
      },
      // 플라스틱 1
      {
        itemId: plastic1.id,
        value: 2.4,
        validFrom: new Date("2024-01-01"),
        validTo: new Date("2024-12-31"),
      },
      {
        itemId: plastic1.id,
        value: 2.3,
        validFrom: new Date("2025-01-01"),
        validTo: null,
      },
      // 플라스틱 2
      {
        itemId: plastic2.id,
        value: 3.3,
        validFrom: new Date("2024-01-01"),
        validTo: new Date("2024-12-31"),
      },
      {
        itemId: plastic2.id,
        value: 3.2,
        validFrom: new Date("2025-01-01"),
        validTo: null,
      },
      // 트럭
      {
        itemId: truck.id,
        value: 3.6,
        validFrom: new Date("2024-01-01"),
        validTo: new Date("2024-12-31"),
      },
      {
        itemId: truck.id,
        value: 3.5,
        validFrom: new Date("2025-01-01"),
        validTo: null,
      },
    ],
  });

  // ── 4. 활동 기록 (2024년 historical 데이터 30행) ──
  // 명세의 30행과 동일한 패턴이지만 2024년 일자로 — Excel 임포트(2025년) 시 중복 없음
  await prisma.activity.deleteMany({});
  const activities = [
    // 전기 / 한국전력 (9건)
    { date: new Date("2024-01-01"), amount: 110, itemId: kepco.id },
    { date: new Date("2024-02-01"), amount: 112, itemId: kepco.id },
    { date: new Date("2024-03-01"), amount: 115, itemId: kepco.id },
    { date: new Date("2024-04-01"), amount: 130, itemId: kepco.id },
    { date: new Date("2024-05-01"), amount: 120, itemId: kepco.id },
    { date: new Date("2024-06-01"), amount: 110, itemId: kepco.id },
    { date: new Date("2024-07-01"), amount: 120, itemId: kepco.id },
    { date: new Date("2024-08-01"), amount: 111, itemId: kepco.id },
    { date: new Date("2024-05-01"), amount: 101, itemId: kepco.id }, // 중복 일자 - 별개 측정

    // 원소재 / 플라스틱 1 (9건)
    { date: new Date("2024-01-01"), amount: 230, itemId: plastic1.id },
    { date: new Date("2024-02-01"), amount: 340, itemId: plastic1.id },
    { date: new Date("2024-03-01"), amount: 430, itemId: plastic1.id },
    { date: new Date("2024-04-01"), amount: 510, itemId: plastic1.id },
    { date: new Date("2024-05-01"), amount: 424, itemId: plastic1.id },
    { date: new Date("2024-06-01"), amount: 450, itemId: plastic1.id },
    { date: new Date("2024-07-01"), amount: 340, itemId: plastic1.id },
    { date: new Date("2024-08-01"), amount: 230, itemId: plastic1.id },
    { date: new Date("2024-05-01"), amount: 232, itemId: plastic1.id }, // 중복 일자

    // 원소재 / 플라스틱 2 (3건)
    { date: new Date("2024-03-01"), amount: 23, itemId: plastic2.id },
    { date: new Date("2024-05-01"), amount: 40, itemId: plastic2.id },
    { date: new Date("2024-07-01"), amount: 43, itemId: plastic2.id },

    // 운송 / 트럭 (9건)
    { date: new Date("2024-01-01"), amount: 41, itemId: truck.id },
    { date: new Date("2024-02-01"), amount: 211, itemId: truck.id },
    { date: new Date("2024-03-01"), amount: 123, itemId: truck.id },
    { date: new Date("2024-04-01"), amount: 42, itemId: truck.id },
    { date: new Date("2024-05-01"), amount: 123, itemId: truck.id },
    { date: new Date("2024-06-01"), amount: 123, itemId: truck.id },
    { date: new Date("2024-07-01"), amount: 41, itemId: truck.id },
    { date: new Date("2024-08-01"), amount: 123, itemId: truck.id },
    { date: new Date("2024-05-01"), amount: 12, itemId: truck.id }, // 중복 일자
  ];
  await prisma.activity.createMany({ data: activities });

  console.log(
    `✅ 시드 완료: 유형 3개, 항목 4개, 계수 8개 (2024/2025 버전), 활동 ${activities.length}건 (2024)`,
  );
}

main()
  .catch((e) => {
    console.error("❌ 시드 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
