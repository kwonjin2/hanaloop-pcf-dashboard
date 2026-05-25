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
