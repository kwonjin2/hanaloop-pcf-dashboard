/**
 * 활동(Activity) 입력 검증 — Zod 스키마.
 *
 * 검증은 두 곳에서 일어남:
 *  1. 클라이언트 (RHF + zodResolver): 즉시 사용자 피드백
 *  2. 서버 (Server Action 진입): 클라이언트 우회 공격 방어
 *
 * 같은 스키마 한 번 정의 → 두 곳에서 사용 (DRY).
 *
 * `z.coerce.number()` 사용 이유:
 *  - HTML form input의 value는 항상 string
 *  - amount를 number로 다루려면 변환 필요
 *  - coerce가 변환 + 검증 한 번에 처리
 */
import { z } from "zod";

export const createActivitySchema = z.object({
  // YYYY-MM-DD 형식 (date input의 표준 출력)
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), {
      message: "유효한 날짜가 아닙니다",
    }),

  // 양수 number (0은 의미 없음)
  amount: z.coerce
    .number({ message: "활동량은 숫자여야 합니다" })
    .positive("활동량은 0보다 커야 합니다"),

  // 활동 항목 ID (양의 정수)
  itemId: z.coerce
    .number({ message: "활동 항목을 선택해주세요" })
    .int()
    .positive("활동 항목을 선택해주세요"),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
