"use client";

/**
 * 대시보드 필터 바.
 *
 * 상태 = URL searchParams (single source of truth).
 *  - 변경 즉시 useRouter().push로 URL 업데이트 → RSC 재실행 → 필터 적용된 데이터로 갱신
 *  - 새로고침/공유/뒤로가기 자연 작동
 *  - 외부 상태 라이브러리 0
 *
 * 필터 (ESG annual report 표준 = 연도 단위):
 *  - 연도 (default: 데이터 최신 연도, "전체 기간" 옵션)
 *  - Scope (1, 2, 3, 전체)
 *  - 활동 유형 (페이지에서 prisma 페치한 ActivityType 목록)
 *
 * 월/일 세부 필터는 UI 노이즈 회피 위해 제거. lib/filters.ts에 from/to 로직은 유지 →
 * URL 직접 조작 (?from=2024-03-01&to=2024-06-30)으로 가능. 데이터 확장 시 UI 추가 예정.
 *
 * "전체" 옵션의 value는 빈 문자열 → shadcn Select 제약으로 ALL_VALUE sentinel.
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
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
import { YEAR_ALL } from "@/lib/filters";

type ActivityTypeOption = {
  id: number;
  name: string;
  scope: number;
};

type Props = {
  activityTypes: ActivityTypeOption[];
  availableYears: number[]; // 데이터에 존재하는 연도 (최신 순)
};

const ALL_VALUE = "__all__"; // shadcn Select는 빈 value 허용 안 함 → sentinel

export function FilterBar({ activityTypes, availableYears }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 연도: URL 없으면 latest (data 있을 때) — page.tsx default와 일관
  const currentYear =
    searchParams.get("year") ??
    (availableYears[0] ? String(availableYears[0]) : YEAR_ALL);
  const currentScope = searchParams.get("scope") ?? ALL_VALUE;
  const currentTypeId = searchParams.get("typeId") ?? ALL_VALUE;

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

  // year 변경 시 from/to 제거 (충돌 방지) + 명시적 year 설정
  function updateYear(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", value);
    params.delete("from");
    params.delete("to");
    router.push(`${pathname}?${params.toString()}`);
  }

  function resetAll() {
    router.push(pathname);
  }

  // "기본값"(URL year 없음 = latest)과 다른 상태일 때만 초기화 버튼 노출
  const hasAnyFilter =
    searchParams.get("year") !== null ||
    currentScope !== ALL_VALUE ||
    currentTypeId !== ALL_VALUE;

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {/* 연도 — ESG annual report 표준 (기본 = 최신 연도) */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-year" className="text-xs">
            연도
          </Label>
          <Select value={currentYear} onValueChange={updateYear}>
            <SelectTrigger id="filter-year" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={YEAR_ALL}>전체 기간</SelectItem>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
