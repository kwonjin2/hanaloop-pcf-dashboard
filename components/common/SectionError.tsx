/**
 * 섹션 단위 에러 fallback UI.
 *
 * silent failure 방지:
 *  - 실패한 섹션만 명시 ("KPI 섹션을 불러올 수 없습니다")
 *  - 다른 섹션은 정상이라는 신호 ("다른 섹션은 정상")
 *  - 단순 복구 가이드 (새로고침)
 *
 * 색상은 red 톤 — 의도적으로 KpiCard나 차트와 다른 시각적 위계.
 */
import { TriangleAlert } from "lucide-react";

type Props = {
  name: string;
};

export function SectionError({ name }: Props) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2 text-red-800">
        <TriangleAlert className="size-4" />
        <span className="text-sm font-medium">
          {name} 섹션을 불러올 수 없습니다
        </span>
      </div>
      <p className="mt-1 text-xs text-red-600">
        다른 섹션은 정상이며, 잠시 후 새로고침해주세요.
      </p>
    </div>
  );
}
