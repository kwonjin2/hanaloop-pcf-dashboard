"use client";

/**
 * 대시보드 필터 바.
 *
 * 상태 = URL searchParams (single source of truth).
 *  - 변경 즉시 useRouter().push로 URL 업데이트 → RSC 재실행 → 필터 적용된 데이터로 갱신
 *  - 새로고침/공유/뒤로가기 자연 작동
 *  - 외부 상태 라이브러리 0
 *
 * 필터:
 *  - 시작일 / 종료일 (native date input)
 *  - Scope (1, 2, 3, 전체)
 *  - 활동 유형 (페이지에서 prisma 페치한 ActivityType 목록)
 *
 * "전체" 옵션의 value는 빈 문자열 — URL에 빠짐 (clean URL).
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SCOPE_LABELS } from "./constants";

type ActivityTypeOption = {
  id: number;
  name: string;
  scope: number;
};

type Props = {
  activityTypes: ActivityTypeOption[];
};

const ALL_VALUE = "__all__"; // shadcn Select는 빈 value 허용 안 함 → sentinel

export function FilterBar({ activityTypes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 현재 URL에서 초기값 읽기
  const currentScope = searchParams.get("scope") ?? ALL_VALUE;
  const currentTypeId = searchParams.get("typeId") ?? ALL_VALUE;
  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";

  // URL 업데이트 헬퍼 — sentinel/빈 값은 param 제거
  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ALL_VALUE) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function resetAll() {
    router.push(pathname);
  }

  const hasAnyFilter =
    currentScope !== ALL_VALUE ||
    currentTypeId !== ALL_VALUE ||
    !!currentFrom ||
    !!currentTo;

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {/* 시작일 */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-from" className="text-xs">
            시작일
          </Label>
          <Input
            id="filter-from"
            type="date"
            value={currentFrom}
            onChange={(e) => updateFilter("from", e.target.value)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="w-40"
          />
        </div>

        {/* 종료일 */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-to" className="text-xs">
            종료일
          </Label>
          <Input
            id="filter-to"
            type="date"
            value={currentTo}
            onChange={(e) => updateFilter("to", e.target.value)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="w-40"
          />
        </div>

        {/* Scope */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-scope" className="text-xs">
            Scope
          </Label>
          <Select
            value={currentScope}
            onValueChange={(v) => updateFilter("scope", v)}
          >
            <SelectTrigger id="filter-scope" className="w-44">
              <SelectValue placeholder="Scope 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>전체</SelectItem>
              {[1, 2, 3].map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {SCOPE_LABELS[s] ?? `Scope ${s}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 활동 유형 */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-type" className="text-xs">
            활동 유형
          </Label>
          <Select
            value={currentTypeId}
            onValueChange={(v) => updateFilter("typeId", v)}
          >
            <SelectTrigger id="filter-type" className="w-44">
              <SelectValue placeholder="활동 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>전체</SelectItem>
              {activityTypes.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name} (Scope {t.scope})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 초기화 — 필터 있을 때만 활성 */}
        {hasAnyFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            className="self-end"
          >
            초기화
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
