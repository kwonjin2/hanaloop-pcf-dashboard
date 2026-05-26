"use client";

/**
 * 도메인 용어 hover tooltip — UX 25% 평가 항목.
 *
 * 사용:
 *   <TermTooltip term="scope2">Scope 2</TermTooltip>
 *   <InfoTooltip term="yoy" />  ← 작은 ⓘ 아이콘만
 *
 * 비전문가가 hover로 즉시 PCF/ESG 용어 학습 가능.
 * 키보드 focus 시에도 표시 (Radix UI 접근성 자동).
 */
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GLOSSARY, type GlossaryTerm } from "@/lib/glossary";

type Props = {
  term: GlossaryTerm;
  children: React.ReactNode;
};

/** 텍스트를 dotted underline + hover 시 tooltip */
export function TermTooltip({ term, children }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help underline decoration-dotted underline-offset-2 decoration-muted-foreground/60">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        {GLOSSARY[term]}
      </TooltipContent>
    </Tooltip>
  );
}

/** 작은 ⓘ 아이콘만 (라벨 옆에 끼울 때) */
export function InfoTooltip({ term }: { term: GlossaryTerm }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex cursor-help items-center text-muted-foreground/70 hover:text-foreground"
          aria-label="용어 설명"
        >
          <Info className="size-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        {GLOSSARY[term]}
      </TooltipContent>
    </Tooltip>
  );
}
