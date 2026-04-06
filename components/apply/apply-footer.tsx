"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const kb = "break-keep text-balance" as const;

type Props = {
  showPrev?: boolean;
  onPrev?: () => void;
  prevHref?: string;
  nextLabel?: string;
  /** 기본 오른쪽 화살표(→) 숨김 — 아이콘+문구만 쓸 때 */
  hideNextArrow?: boolean;
  /** 주요 액션 버튼 앞에 아이콘 등 */
  nextLeading?: ReactNode;
  onNext?: () => void;
  nextDisabled?: boolean;
  /** Step 3: 결제 CTA 대신 일반 다음 자리 */
  paymentMode?: boolean;
  /** 목록이 비었을 때 결제 링크 비활성화용 */
  paymentDisabled?: boolean;
};

export function ApplyFooter({
  showPrev = true,
  onPrev,
  prevHref,
  nextLabel = "저장하고 다음 단계로",
  hideNextArrow = false,
  nextLeading,
  onNext,
  nextDisabled = false,
  paymentMode = false,
  paymentDisabled = false,
}: Props) {
  return (
    <footer
      className={`sticky bottom-0 z-40 mt-10 border-t border-amber-200/60 bg-stone-50/95 px-4 py-4 backdrop-blur-md sm:px-0 ${kb}`}
    >
      <div className="mx-auto flex max-w-3xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {showPrev ? (
          prevHref != null ? (
            <Link
              href={prevHref}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-zinc-300 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-stone-50"
            >
              ← 이전 단계로
            </Link>
          ) : (
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-zinc-300 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-stone-50"
            >
              ← 이전 단계로
            </button>
          )
        ) : (
          <span className="hidden sm:block sm:min-w-[8rem]" aria-hidden />
        )}

        {paymentMode ? (
          paymentDisabled ? (
            <span
              className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-zinc-200 px-8 py-4 text-base font-bold text-zinc-500 sm:w-auto sm:min-w-[14rem]"
              title="제품을 한 건 이상 추가한 뒤 결제할 수 있습니다."
            >
              결제하기 (제품 추가 필요)
            </span>
          ) : (
            <Link
              href="/checkout"
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 px-8 py-4 text-base font-bold text-emerald-950 shadow-lg shadow-emerald-950/20 ring-2 ring-amber-500/40 transition hover:from-amber-300 hover:to-amber-100 sm:w-auto sm:min-w-[14rem]"
            >
              결제하기
            </Link>
          )
        ) : (
          <button
            type="button"
            disabled={nextDisabled}
            onClick={onNext}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-950 px-8 py-3.5 text-sm font-bold text-amber-100 shadow-lg shadow-emerald-950/25 transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[12rem]"
          >
            {nextLeading}
            <span>{nextLabel}</span>
            {hideNextArrow ? null : <span aria-hidden>→</span>}
          </button>
        )}
      </div>
    </footer>
  );
}
