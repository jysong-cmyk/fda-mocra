"use client";

import { AicraHeader } from "@/components/aicra-header";
import { MOCRA_CHECKOUT_ORDER_NAME } from "@/lib/checkout-constants";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const kb = "break-keep text-balance" as const;

function firstParam(v: string | string[] | null | undefined): string | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const paymentKey = firstParam(searchParams.get("paymentKey"));
  const orderId = firstParam(searchParams.get("orderId"));
  const amountRaw = firstParam(searchParams.get("amount"));
  const amountNum =
    amountRaw != null && amountRaw !== "" ? Number(amountRaw) : NaN;
  const amountOk = Number.isFinite(amountNum);

  return (
    <div className={`min-h-screen bg-stone-50 ${kb}`}>
      <AicraHeader page="home" />
      <main className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <div className="overflow-hidden rounded-2xl border border-emerald-200/50 bg-white shadow-xl shadow-emerald-950/10">
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 px-6 py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-300/20 ring-2 ring-amber-300/40">
              <svg
                className="h-8 w-8 text-amber-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mt-6 text-2xl font-bold text-amber-50">
              결제가 완료되었습니다
            </h1>
            <p className="mt-2 text-sm text-amber-100/85">
              {MOCRA_CHECKOUT_ORDER_NAME} 결제가 정상적으로 처리되었습니다.
            </p>
          </div>
          <div className="space-y-4 px-6 py-8">
            {orderId != null ? (
              <dl className="rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-3 text-sm">
                <dt className="text-xs font-medium text-zinc-500">주문번호</dt>
                <dd className="mt-1 break-all font-mono text-zinc-900">
                  {orderId}
                </dd>
              </dl>
            ) : null}
            {amountOk ? (
              <dl className="rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-3 text-sm">
                <dt className="text-xs font-medium text-zinc-500">결제 금액</dt>
                <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-900">
                  {new Intl.NumberFormat("ko-KR", {
                    style: "currency",
                    currency: "KRW",
                    maximumFractionDigits: 0,
                  }).format(amountNum)}
                </dd>
              </dl>
            ) : null}
            {paymentKey != null ? (
              <dl className="rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-3 text-sm">
                <dt className="text-xs font-medium text-zinc-500">
                  결제 키 (참고)
                </dt>
                <dd className="mt-1 break-all font-mono text-xs text-zinc-600">
                  {paymentKey}
                </dd>
              </dl>
            ) : null}
            {orderId == null && !amountOk && paymentKey == null ? (
              <p className="text-center text-sm text-zinc-600">
                URL에 결제 정보가 없습니다. 결제를 다시 시도하거나 고객센터로
                문의해 주세요.
              </p>
            ) : null}
            <p className="text-center text-xs leading-relaxed text-zinc-500">
              실제 서비스에서는 이 화면에서 결제 검증 API를 호출해 주문을
              확정하는 것이 안전합니다.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
              <Link
                href="/apply/step1"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-950 px-6 py-3 text-sm font-semibold text-amber-100 transition hover:bg-emerald-900"
              >
                등록 절차 계속하기
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
