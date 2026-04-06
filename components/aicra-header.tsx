"use client";

import Link from "next/link";

const k = "break-keep text-balance" as const;

export type AicraHeaderPage = "home" | "register" | "admin" | "sales";

export function AicraHeader({ page }: { page: AicraHeaderPage }) {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-950/10 bg-stone-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[4.25rem] sm:px-6">
        <Link href="/" className={`shrink-0 cursor-pointer ${k}`}>
          <span className="inline-flex rounded-lg bg-emerald-950 px-3 py-2 text-base font-bold tracking-tight text-amber-300 shadow-sm ring-1 ring-amber-400/30 transition hover:bg-emerald-900 hover:text-amber-200 sm:text-lg">
            Aicra
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {page === "register" ? (
            <Link
              href="/"
              className={`cursor-pointer rounded-full border border-emerald-950/25 bg-white px-4 py-2 text-sm font-medium text-emerald-950 shadow-sm transition hover:border-amber-400/50 hover:bg-stone-50 ${k}`}
            >
              메인
            </Link>
          ) : (
            <>
              {(page === "admin" || page === "sales") && (
                <span
                  className={`hidden rounded-full border border-amber-200/40 bg-emerald-950/5 px-3 py-1.5 text-xs font-semibold text-emerald-900 sm:inline ${k}`}
                >
                  {page === "admin" ? "관리자" : "영업"}
                </span>
              )}
              <Link
                href="/register"
                className={`max-w-[11.5rem] cursor-pointer rounded-full border border-amber-400/40 bg-emerald-950 px-3 py-2 text-center text-[10px] font-semibold leading-tight text-stone-50 shadow-sm transition hover:bg-emerald-900 hover:ring-2 hover:ring-amber-400/25 sm:max-w-none sm:px-5 sm:text-sm sm:leading-snug ${k}`}
              >
                Aicra와 함께 지금 바로 등록하기 →
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/** 메인 히어로 CTA와 동일 톤 — 풀폭 버튼에 `w-full` 추가. 문구는 랜딩 CTA와 맞춤 */
export const aicraGradientCtaClass =
  `inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-200 to-amber-300 font-semibold text-emerald-950 shadow-md shadow-emerald-950/15 ring-1 ring-amber-400/50 transition hover:from-emerald-800 hover:to-emerald-700 hover:text-stone-50 hover:ring-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-60 ${k}`;
