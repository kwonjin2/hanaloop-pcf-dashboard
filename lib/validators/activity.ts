/**
 * 활동(Activity) 입력 검증 — Zod 스키마.
 *
 * 검증은 두 곳에서 일어남:
 *  1. 클라이언트 (RHF + zodResolver): 즉시 사용자 피드백
 *  2. 서버 (Server Action 진입): 클라이언트 우회 공격 방어
 *
 * 같은 스키마 한 번 정의 → 두 곳에서 사용 (DRY).
 *
 * 숫자 변환은 RHF의 `valueAsNumber: true`로 처리 (zod coerce 안 씀).
 *  - coerce 사용 시 zod의 input 타입(unknown)과 output 타입(number)이 분리되어
 *    RHF 타입 추론(Resolver)과 충돌. number 직접 검증이 호환성 좋음.
 *  - server action 호출 전 RHF가 typed number로 전달 → server 재검증도 number 기대
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

  // 양수 number (0은 의미 없음 → "0보다 커야" 메시지로 0 default도 잡힘)
  amount: z
    .number({ message: "활동량은 숫자여야 합니다" })
    .positive("활동량은 0보다 커야 합니다"),

  // 활동 항목 ID (양의 정수, 0은 "미선택"으로 간주)
  itemId: z
    .number({ message: "활동 항목을 선택해주세요" })
    .int()
    .positive("활동 항목을 선택해주세요"),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
