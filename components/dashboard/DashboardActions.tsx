"use client";

/**
 * 대시보드 상단 액션 영역 — 활동 추가 트리거.
 *
 * 책임 분리:
 *  - 이 컴포넌트: Drawer open state 관리 + trigger 버튼
 *  - ActivityFormDrawer: 실제 form + Server Action 호출
 *
 * 향후 Task 5(Excel 임포트) 진입 시 같은 패턴으로 "Excel 임포트" 버튼 추가 예정.
 */
import { useState } from "react";
import { Plus, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityFormDialog } from "./ActivityFormDialog";
import { ImportExcelDialog } from "./ImportExcelDialog";

type ActivityItemOption = {
  id: number;
  name: string;
  unit: string;
  typeId: number;
};

type ActivityTypeOption = {
  id: number;
  name: string;
  scope: number;
};

type Props = {
  activityItems: ActivityItemOption[];
  activityTypes: ActivityTypeOption[];
};

export function DashboardActions({ activityItems, activityTypes }: Props) {
  const [activityOpen, setActivityOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setImportOpen(true)}
      >
        <FileSpreadsheet className="size-4" />
        Excel 임포트
      </Button>
      <Button size="sm" onClick={() => setActivityOpen(true)}>
        <Plus className="size-4" />
        활동 추가
      </Button>

      <ImportExcelDialog open={importOpen} onOpenChange={setImportOpen} />
      <ActivityFormDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        activityItems={activityItems}
        activityTypes={activityTypes}
      />
    </div>
  );
}
