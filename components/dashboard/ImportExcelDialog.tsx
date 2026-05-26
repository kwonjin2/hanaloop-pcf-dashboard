"use client";

/**
 * Excel 활동 임포트 Dialog.
 *
 * 흐름:
 *  1. 파일 선택 (.xlsx) → 선택 정보 표시
 *  2. "임포트 실행" 클릭 → arrayBuffer 변환 → importActivities Server Action
 *  3. 결과 표시 (imported/skipped/errors)
 *  4. "닫기" 클릭 → state 초기화 + Dialog close
 *
 * 명세 Excel 형식:
 *  - "과제용 데이터" 시트
 *  - 헤더: 일자(원본) / 활동 유형 / 설명 / 량 / 단위 (3행)
 *  - 설명 컬럼 = ActivityItem.name
 *
 * Dedupe: 같은 일자+항목+량은 자동 skip (기존 DB + 같은 파일 내).
 */
import { useRef, useState, useTransition } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
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
import { importActivities } from "@/app/actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ImportResultState =
  | { type: "success"; imported: number; skipped: number; errors: string[] }
  | { type: "error"; message: string };

export function ImportExcelDialog({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResultState | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      // Dialog 닫을 때 state 초기화
      setFile(null);
      setResult(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    onOpenChange(nextOpen);
  }

  function handleImport() {
    if (!file) return;

    startTransition(async () => {
      const buffer = await file.arrayBuffer();
      const res = await importActivities(buffer);

      if (res.success) {
        setResult({
          type: "success",
          imported: res.imported,
          skipped: res.skipped,
          errors: res.errors,
        });
        if (res.imported > 0) {
          toast.success(`${res.imported}건 임포트 완료`);
        } else if (res.skipped > 0) {
          toast.info("모두 중복 데이터로 건너뜀");
        }
      } else {
        setResult({ type: "error", message: res.error });
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5" />
            Excel 임포트
          </DialogTitle>
          <DialogDescription>
            명세 Excel 파일을 그대로 업로드하면 활동 데이터가 추가됩니다.
            <br />
            <span className="text-xs">
              · 시트: <code className="text-foreground">과제용 데이터</code>
              <br />· 같은 일자 + 항목 + 량은 자동 중복 처리
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* 임포트 전: 파일 선택 */}
        {!result && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-muted/80"
            />
            {file && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <div className="font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            )}
          </div>
        )}

        {/* 임포트 후: 결과 */}
        {result?.type === "success" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <ResultStat label="추가됨" value={result.imported} tone="success" />
              <ResultStat label="중복 skip" value={result.skipped} tone="info" />
              <ResultStat
                label="오류 행"
                value={result.errors.length}
                tone={result.errors.length > 0 ? "warning" : "muted"}
              />
            </div>

            {result.errors.length > 0 && (
              <details className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs">
                <summary className="cursor-pointer font-medium text-amber-800">
                  오류 {result.errors.length}건 보기
                </summary>
                <ul className="mt-2 space-y-1 text-amber-900">
                  {result.errors.slice(0, 20).map((err, i) => (
                    <li key={i} className="font-mono">
                      {err}
                    </li>
                  ))}
                  {result.errors.length > 20 && (
                    <li className="text-amber-700">
                      ...외 {result.errors.length - 20}건
                    </li>
                  )}
                </ul>
              </details>
            )}
          </div>
        )}

        {result?.type === "error" && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {result.message}
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={pending}
              >
                취소
              </Button>
              <Button onClick={handleImport} disabled={!file || pending}>
                <Upload className="size-4" />
                {pending ? "임포트 중..." : "임포트 실행"}
              </Button>
            </>
          ) : (
            <Button onClick={() => handleClose(false)}>닫기</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "info" | "warning" | "muted";
}) {
  const toneClass = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    info: "bg-sky-50 text-sky-800 border-sky-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    muted: "bg-muted/50 text-muted-foreground border-border",
  }[tone];

  return (
    <div className={`rounded-md border p-2 ${toneClass}`}>
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
