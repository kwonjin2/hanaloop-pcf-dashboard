"use client";

/**
 * 활동 삭제 버튼 + 확인 Dialog.
 *
 * 삭제는 되돌릴 수 없는 작업 → confirm Dialog 필수 (실수 방지).
 *  - trigger: trash 아이콘 (작은 ghost button, 행마다 표시)
 *  - Dialog: 활동 정보 라벨 + "취소" / "삭제" 버튼
 *  - deleteActivity Server Action 호출 → 성공 시 toast + Dialog close + 자동 갱신
 *
 * 한 줄 책임 = 한 컴포넌트. ActivityTable은 RSC compatible 유지, 이 client wrapper만 행마다 마운트.
 */
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteActivity } from "@/app/actions";

type Props = {
  id: number;
  label: string; // 확인 메시지에 표시 (예: "2024-01-01 한국전력 110 kWh")
};

export function DeleteActivityButton({ id, label }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteActivity(id);
      if (result.success) {
        toast.success("활동이 삭제되었습니다");
        setOpen(false);
        // revalidatePath('/')가 server에서 발동 → 페이지 RSC 재실행 → 테이블 자동 갱신
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={() => setOpen(true)}
        aria-label="활동 삭제"
      >
        <Trash2 className="size-4 text-muted-foreground hover:text-red-600" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>활동 삭제</DialogTitle>
            <DialogDescription>
              아래 활동을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md bg-muted/50 p-3 text-sm font-mono">
            {label}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={pending}
            >
              {pending ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
