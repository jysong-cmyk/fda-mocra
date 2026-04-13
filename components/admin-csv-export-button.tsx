"use client";

import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

const kb = "break-keep text-balance" as const;

type AdminCsvExportButtonProps = {
  /** true면 상단 여백·구분선 없음(부모에서 RPA 버튼 등과 함께 묶을 때) */
  compact?: boolean;
};

/** 관리자 화면 하단에만 배치. 기존 페이지 로직과 분리된 CSV 다운로드 UI. */
export function AdminCsvExportButton({ compact = false }: AdminCsvExportButtonProps) {
  const [pending, setPending] = useState(false);

  const handleClick = useCallback(async () => {
    const {
      data: { session: s },
    } = await supabase.auth.getSession();
    const accessToken = s?.access_token?.trim() ?? "";
    if (accessToken === "") {
      alert("로그인이 필요합니다. 세션 토큰이 없어 CSV를 요청할 수 없습니다.");
      return;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const fallbackFilename = `fda_mocra_data_${dateStr}.csv`;

    setPending(true);
    try {
      const res = await fetch("/api/export-csv", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "text/csv",
        },
      });
      if (!res.ok) {
        let msg = res.statusText;
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error != null) msg = j.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      let filename = fallbackFilename;
      const m = cd?.match(/filename="([^"]+)"/);
      if (m?.[1] != null) filename = m[1];
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e) {
      console.error(e);
      alert(
        e instanceof Error ? e.message : "다운로드에 실패했습니다.",
      );
    } finally {
      setPending(false);
    }
  }, []);

  const shell =
    compact === true
      ? ""
      : `mt-10 border-t border-amber-200/40 pt-8 ${kb}`;

  return (
    <div className={shell}>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={pending}
        className="w-full cursor-pointer rounded-2xl border-2 border-amber-300/60 bg-gradient-to-r from-emerald-900 to-emerald-950 px-6 py-5 text-center text-base font-bold tracking-tight text-amber-50 shadow-lg shadow-emerald-950/25 transition-[transform,opacity] hover:from-emerald-950 hover:to-emerald-950 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:py-6 sm:text-lg"
      >
        {pending ? "파일 준비 중…" : "고객 데이터 엑셀(CSV) 다운로드"}
      </button>
      <p className="mt-2 text-center text-xs text-zinc-500">
        DB에 저장된 전체 제품 신청 행을 UTF-8 CSV로 받습니다. Excel에서 열 때
        한글이 깨지면 &quot;데이터 &gt; 텍스트/CSV에서&quot;로 가져오기를
        이용해 주세요.
      </p>
    </div>
  );
}
