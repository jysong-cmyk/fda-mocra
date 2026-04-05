"use client";

import { AicraHeader } from "@/components/aicra-header";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const kb = "break-keep text-balance" as const;

function firstParam(v: string | string[] | null | undefined): string | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function safeDecodeURIComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function CheckoutFailClient() {
  const searchParams = useSearchParams();
  const code = firstParam(searchParams.get("code"));
  const message = firstParam(searchParams.get("message"));
  const orderId = firstParam(searchParams.get("orderId"));

  return (
    <div className={`min-h-screen bg-stone-50 ${kb}`}>
      <AicraHeader page="home" />
      <main className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <div className="overflow-hidden rounded-2xl border border-amber-200/60 bg-white shadow-xl shadow-amber-900/10">
          <div className="border-b border-amber-100 bg-amber-50/90 px-6 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-200/60 ring-2 ring-amber-400/50">
              <svg
                className="h-7 w-7 text-amber-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-bold text-emerald-950 sm:text-2xl">
              결제에 실패했습니다
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              결제가 완료되지 않았습니다. 다른 결제 수단으로 다시 시도해
              주세요.
            </p>
          </div>
          <div className="space-y-4 px-6 py-8">
            {message != null && message !== "" ? (
              <div className="rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700/90">
                  사유
                </p>
                <p className="mt-1 break-words">
                  {safeDecodeURIComponent(message)}
                </p>
              </div>
            ) : null}
            {(code != null && code !== "") || (orderId != null && orderId !== "") ? (
              <dl className="space-y-3 rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-3 text-sm">
                {code != null && code !== "" ? (
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">코드</dt>
                    <dd className="mt-0.5 font-mono text-zinc-900">{code}</dd>
                  </div>
                ) : null}
                {orderId != null && orderId !== "" ? (
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">
                      주문번호
                    </dt>
                    <dd className="mt-0.5 break-all font-mono text-zinc-900">
                      {orderId}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-950 px-6 py-3 text-sm font-semibold text-amber-100 transition hover:bg-emerald-900"
              >
                다시 결제하기
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-950/20 bg-white px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-stone-50"
              >
                메인으로
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
