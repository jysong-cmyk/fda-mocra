"use client";

import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

function yyyymmddLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** READY 제품만 MoCRA RPA용 ZIP(목록 CSV + 성분 CSV) 다운로드 */
export function AdminRpaExportButton() {
  const [pending, setPending] = useState(false);

  const handleClick = useCallback(async () => {
    const {
      data: { session: s },
    } = await supabase.auth.getSession();
    const accessToken = s?.access_token?.trim() ?? "";
    if (accessToken === "") {
      alert("로그인이 필요합니다. 세션 토큰이 없어 파일을 요청할 수 없습니다.");
      return;
    }

    const fallbackFilename = `rpa_export_${yyyymmddLocal(new Date())}.zip`;

    setPending(true);
    try {
      const res = await fetch("/api/export-rpa", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/zip",
        },
      });
      if (!res.ok) {
        const emptyReadyMsg = "다운로드할 신규 데이터(READY)가 없습니다.";
        let msg = res.statusText;
        try {
          const j = (await res.json()) as { error?: string; message?: string };
          if (j.message != null) msg = j.message;
          else if (j.error != null) msg = j.error;
        } catch {
          /* ignore */
        }
        if (msg === emptyReadyMsg) {
          alert("다운로드할 신규 데이터가 없습니다.");
          return;
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
      alert("다운로드가 완료되었습니다.");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "다운로드에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }, []);

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={pending}
      className="w-full cursor-pointer rounded-2xl border-2 border-sky-400/70 bg-gradient-to-r from-sky-800 to-sky-950 px-6 py-5 text-center text-base font-bold tracking-tight text-sky-50 shadow-lg shadow-sky-950/30 transition-[transform,opacity] hover:from-sky-900 hover:to-sky-950 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:py-6 sm:text-lg"
    >
      {pending ? "ZIP 준비 중…" : "📥 RPA용 신규 제출 데이터 다운로드"}
    </button>
  );
}
