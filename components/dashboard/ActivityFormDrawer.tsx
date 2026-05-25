"use client";

/**
 * 활동 입력 Drawer — RHF + Zod + Server Action 패턴.
 *
 * 데이터 흐름:
 *  1. RHF가 form state 관리 + zodResolver로 즉시 검증 (사용자 피드백)
 *  2. submit → handleSubmit → typed values → createActivity Server Action
 *  3. server에서 동일 Zod 스키마 재검증 (우회 공격 방어)
 *  4. 성공: revalidatePath('/') → 페이지 RSC 재실행 → 모든 섹션 자동 갱신
 *     실패: 필드별 에러 표시 + toast
 *
 * Drawer 제어:
 *  - open state 외부 trigger와 분리 (DrawerTrigger 자녀로 두지 않음)
 *  - 부모에서 trigger 버튼 따로 두고 open prop으로 제어 — DashboardHeader 등에서 호출
 */
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createActivity } from "@/app/actions";
import {
  createActivitySchema,
  type CreateActivityInput,
} from "@/lib/validators/activity";

type ActivityTypeOption = {
  id: number;
  name: string;
  scope: number;
};

type ActivityItemOption = {
  id: number;
  name: string;
  unit: string;
  typeId: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityItems: ActivityItemOption[];
  activityTypes: ActivityTypeOption[];
};

export function ActivityFormDrawer({
  open,
  onOpenChange,
  activityItems,
  activityTypes,
}: Props) {
  const [pending, startTransition] = useTransition();
  // 선택된 itemId — 단위 표시용 (예: "kWh")
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  const form = useForm<CreateActivityInput>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: {
      date: "",
      // RHF + zodResolver 조합에서 number 기본값을 NaN으로 두면 검증 단계에서 에러.
      // 0으로 두고 사용자 입력으로 덮어쓰게.
      amount: 0,
      itemId: 0,
    },
  });

  const selectedItem = activityItems.find(
    (i) => i.id === Number(selectedItemId),
  );

  function onSubmit(values: CreateActivityInput) {
    startTransition(async () => {
      const result = await createActivity(values);
      if (result.success) {
        toast.success("활동이 저장되었습니다");
        form.reset();
        setSelectedItemId("");
        onOpenChange(false);
      } else {
        // Zod fieldErrors → RHF setError로 매핑
        for (const [field, msgs] of Object.entries(result.error)) {
          if (msgs?.[0]) {
            form.setError(field as keyof CreateActivityInput, {
              type: "server",
              message: msgs[0],
            });
          }
        }
        toast.error("저장에 실패했습니다");
      }
    });
  }

  // 활동 항목을 type별로 그룹핑 — select가 직관적
  const itemsByType = activityTypes.map((type) => ({
    type,
    items: activityItems.filter((i) => i.typeId === type.id),
  }));

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>활동 추가</DrawerTitle>
            <DrawerDescription>
              날짜, 활동 항목, 활동량을 입력하면 시점에 맞는 배출계수로 자동
              계산됩니다.
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
            {/* 날짜 */}
            <div className="space-y-1.5">
              <Label htmlFor="activity-date">날짜</Label>
              <Input
                id="activity-date"
                type="date"
                {...form.register("date")}
              />
              {form.formState.errors.date && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>

            {/* 활동 항목 (그룹화 select) */}
            <div className="space-y-1.5">
              <Label htmlFor="activity-item">활동 항목</Label>
              <Select
                value={selectedItemId}
                onValueChange={(v) => {
                  setSelectedItemId(v);
                  form.setValue("itemId", Number(v), { shouldValidate: true });
                }}
              >
                <SelectTrigger id="activity-item">
                  <SelectValue placeholder="항목 선택" />
                </SelectTrigger>
                <SelectContent>
                  {itemsByType.map(({ type, items }) =>
                    items.length === 0 ? null : (
                      <div key={type.id}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {type.name} (Scope {type.scope})
                        </div>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.name} ({item.unit})
                          </SelectItem>
                        ))}
                      </div>
                    ),
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.itemId && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.itemId.message}
                </p>
              )}
            </div>

            {/* 활동량 (선택된 항목의 단위 sublabel로 표시) */}
            <div className="space-y-1.5">
              <Label htmlFor="activity-amount">
                활동량
                {selectedItem && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({selectedItem.unit})
                  </span>
                )}
              </Label>
              <Input
                id="activity-amount"
                type="number"
                step="any"
                min="0"
                {...form.register("amount", { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <DrawerFooter className="px-0">
              <Button type="submit" disabled={pending}>
                {pending ? "저장 중..." : "저장"}
              </Button>
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  취소
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
