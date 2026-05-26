"use server";

/**
 * 활동 mutation Server Actions.
 *
 * Z+ 패러다임 (Next.js 16 best practice):
 *  - 'use server' directive → 클라이언트에서 RPC처럼 호출
 *  - revalidatePath('/') → 페이지 캐시 무효화 → RSC 재실행 → 새 데이터 자동 반영
 *  - TanStack Query invalidateQueries보다 단순 (외부 라이브러리 0)
 *
 * 반환값 형식 통일: { success: true } | { success: false, error: ... }
 *  - 호출자가 union narrowing으로 안전하게 분기
 *  - sonner toast로 결과 피드백
 */
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  createActivitySchema,
  type CreateActivityInput,
} from "@/lib/validators/activity";

type ActionResult<E = string> =
  | { success: true }
  | { success: false; error: E };

/**
 * 활동 생성.
 *
 * 서버 재검증: 클라이언트 RHF 검증을 우회한 직접 호출 방어.
 * 같은 Zod 스키마 사용 → DRY.
 */
export async function createActivity(
  input: CreateActivityInput,
): Promise<ActionResult<Record<string, string[] | undefined>>> {
  const parsed = createActivitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.activity.create({
    data: {
      date: new Date(parsed.data.date),
      amount: parsed.data.amount,
      itemId: parsed.data.itemId,
    },
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * 활동 삭제.
 *
 * id 검증: positive integer만 허용. URL 조작/실수 방어.
 * Prisma는 없는 id에 대해 에러 throw → 위로 전파 (호출자가 catch 가능).
 */
export async function deleteActivity(id: number): Promise<ActionResult> {
  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, error: "유효하지 않은 활동 ID입니다" };
  }

  try {
    await prisma.activity.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "활동을 찾을 수 없거나 삭제 실패했습니다" };
  }
}

/**
 * Excel 활동 일괄 임포트.
 *
 * 명세 Excel 형식 ("과제용 데이터" 시트):
 *  - 헤더 행: 3행 (1: 제목, 2: 안내, 3: 컬럼명)
 *  - 컬럼: 일자(원본) / 활동 유형 / 설명 / 량 / 단위
 *  - "설명" 컬럼이 ActivityItem.name과 매칭
 *
 * Dedupe (AGENTS.md): 같은 일자 + 항목 + 량 정확 일치 시 skip.
 *  - 기존 DB activities와 비교
 *  - 같은 파일 내 중복도 막음 (existingKeys에 추가하며 진행)
 *
 * 검증 (관대한 파싱 — 문제 행은 skip + errors 누적, 전체는 진행):
 *  - 일자 변환 실패 → skip
 *  - 알 수 없는 항목명 → skip
 *  - amount가 양수 아님 → skip
 *
 * cellDates: true — xlsx가 Excel date serial을 자동 Date 객체로 변환
 */
const IMPORT_SHEET = "과제용 데이터";
const IMPORT_HEADER_ROW = 2; // 0-indexed (Excel row 3)

type ImportResult = {
  success: true;
  imported: number;
  skipped: number;
  errors: string[];
};

type ImportError = { success: false; error: string };

export async function importActivities(
  buffer: ArrayBuffer,
): Promise<ImportResult | ImportError> {
  // 1. parse
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { cellDates: true });
  } catch {
    return { success: false, error: "Excel 파일을 읽을 수 없습니다" };
  }

  const sheet = wb.Sheets[IMPORT_SHEET];
  if (!sheet) {
    return {
      success: false,
      error: `'${IMPORT_SHEET}' 시트를 찾을 수 없습니다`,
    };
  }

  type Row = {
    "일자(원본)"?: Date | string;
    "활동 유형"?: string;
    설명?: string;
    량?: number | string;
    단위?: string;
  };
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, {
    range: IMPORT_HEADER_ROW,
  });

  // 2. lookup 준비
  const items = await prisma.activityItem.findMany();
  const itemByName = new Map(items.map((i) => [i.name, i]));

  // 3. 기존 activities → dedupe key set
  const existing = await prisma.activity.findMany({
    select: { date: true, itemId: true, amount: true },
  });
  const dedupeKey = (date: Date, itemId: number, amount: number) =>
    `${date.getTime()}-${itemId}-${amount}`;
  const existingKeys = new Set(
    existing.map((a) => dedupeKey(a.date, a.itemId, a.amount)),
  );

  // 4. 행별 검증 + 변환
  const toInsert: Array<{ date: Date; itemId: number; amount: number }> = [];
  const errors: string[] = [];
  let skipped = 0;

  rows.forEach((row, idx) => {
    const rowNum = idx + IMPORT_HEADER_ROW + 2; // 사람 친화 (Excel row 4부터)

    // 일자
    const rawDate = row["일자(원본)"];
    let date: Date;
    if (rawDate instanceof Date) {
      date = rawDate;
    } else if (typeof rawDate === "string" && rawDate) {
      date = new Date(rawDate);
    } else {
      errors.push(`행 ${rowNum}: 일자가 없거나 형식 오류`);
      return;
    }
    if (Number.isNaN(date.getTime())) {
      errors.push(`행 ${rowNum}: 유효하지 않은 일자 (${String(rawDate)})`);
      return;
    }

    // 항목 (설명 컬럼 = ActivityItem.name)
    const itemName = String(row["설명"] ?? "").trim();
    const item = itemByName.get(itemName);
    if (!item) {
      errors.push(`행 ${rowNum}: 알 수 없는 항목 "${itemName}"`);
      return;
    }

    // 활동량
    const amount = Number(row["량"]);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push(`행 ${rowNum}: 활동량 오류 (${String(row["량"])})`);
      return;
    }

    // dedupe
    const key = dedupeKey(date, item.id, amount);
    if (existingKeys.has(key)) {
      skipped++;
      return;
    }
    existingKeys.add(key);

    toInsert.push({ date, itemId: item.id, amount });
  });

  // 5. bulk insert (있을 때만)
  if (toInsert.length > 0) {
    await prisma.activity.createMany({ data: toInsert });
  }

  revalidatePath("/");
  return {
    success: true,
    imported: toInsert.length,
    skipped,
    errors,
  };
}
