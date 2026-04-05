"use client";

import { AicraHeader } from "@/components/aicra-header";
import {
  MOCRA_CHECKOUT_AMOUNT_KRW,
  MOCRA_CHECKOUT_ORDER_NAME,
} from "@/lib/checkout-constants";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ANONYMOUS,
  clearPaymentWidget,
  loadPaymentWidget,
  type PaymentWidgetInstance,
} from "@tosspayments/payment-widget-sdk";

const kb = "break-keep text-balance" as const;

type AgreementWidgetApi = ReturnType<
  PaymentWidgetInstance["renderAgreement"]
>;

function formatKrw(n: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(n);
}

function makeOrderId(): string {
  const u =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : String(Math.random()).slice(2, 14);
  return `aicra-mocra-${Date.now()}-${u}`;
}

export function CheckoutClient() {
  const widgetRef = useRef<PaymentWidgetInstance | null>(null);
  const agreementRef = useRef<AgreementWidgetApi | null>(null);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

  useEffect(() => {
    if (clientKey == null || clientKey === "") {
      setInitError(
        "NEXT_PUBLIC_TOSS_CLIENT_KEY가 설정되지 않았습니다. .env.local을 확인해 주세요.",
      );
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const paymentWidget = await loadPaymentWidget(clientKey, ANONYMOUS);
        if (cancelled) return;

        paymentWidget.renderPaymentMethods(
          "#payment-widget-methods",
          { currency: "KRW", value: MOCRA_CHECKOUT_AMOUNT_KRW },
        );
        agreementRef.current = paymentWidget.renderAgreement(
          "#payment-widget-agreement",
        );
        widgetRef.current = paymentWidget;
        setReady(true);
      } catch (e) {
        if (!cancelled) {
          setInitError(
            e instanceof Error
              ? e.message
              : "결제 위젯을 불러오지 못했습니다.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      widgetRef.current = null;
      agreementRef.current = null;
      clearPaymentWidget();
    };
  }, [clientKey]);

  const handlePay = useCallback(async () => {
    setPayError(null);
    const widget = widgetRef.current;
    const agreement = agreementRef.current;
    if (widget == null || agreement == null) {
      setPayError("결제 준비가 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    const { agreedRequiredTerms } = agreement.getAgreementStatus();
    if (!agreedRequiredTerms) {
      setPayError("필수 결제·이용 약관에 동의해 주세요.");
      return;
    }

    const origin = window.location.origin;
    setPaying(true);
    try {
      await widget.requestPayment({
        orderId: makeOrderId(),
        orderName: MOCRA_CHECKOUT_ORDER_NAME,
        successUrl: `${origin}/checkout/success`,
        failUrl: `${origin}/checkout/fail`,
      });
    } catch (e) {
      setPaying(false);
      setPayError(
        e instanceof Error ? e.message : "결제 요청 중 오류가 발생했습니다.",
      );
    }
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-b from-stone-100 to-stone-200/90 ${kb}`}>
      <AicraHeader page="home" />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800/80">
            Aicra Checkout
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
            MOCRA 등록비 결제
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-600">
            카드·간편결제 등 토스페이먼츠에서 제공하는 수단으로 안전하게 결제할
            수 있습니다.
          </p>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-amber-200/50 bg-white shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-950/5">
            <div className="border-b border-amber-100/80 bg-gradient-to-r from-emerald-950 to-emerald-900 px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-200/90">
                    결제 상품
                  </p>
                  <p className="mt-1 text-lg font-bold text-amber-50">
                    {MOCRA_CHECKOUT_ORDER_NAME}
                  </p>
                  <p className="mt-2 text-xs text-amber-100/75">
                    FDA 화장품 시설·제품 등록 절차 이용료
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-amber-200/90">
                    결제 금액
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-amber-100">
                    {formatKrw(MOCRA_CHECKOUT_AMOUNT_KRW)}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 px-6 py-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-800 shadow-sm ring-1 ring-stone-200/80">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-zinc-800">카드</p>
                  <p className="text-[11px] text-zinc-500">신용·체크</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-800 shadow-sm ring-1 ring-stone-200/80">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-zinc-800">간편결제</p>
                  <p className="text-[11px] text-zinc-500">토스 등 연동</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-800 shadow-sm ring-1 ring-stone-200/80">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-zinc-800">안전 결제</p>
                  <p className="text-[11px] text-zinc-500">토스페이먼츠</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200/40 bg-white p-5 shadow-md shadow-emerald-950/5 sm:p-6">
            <h2 className="text-sm font-bold text-emerald-950">
              결제 수단 선택
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              아래에서 원하는 결제 수단을 고른 뒤 약관에 동의하고 결제를
              진행하세요.
            </p>
            {initError != null ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {initError}
              </div>
            ) : (
              <>
                <div
                  id="payment-widget-methods"
                  className="mt-6 min-h-[220px] w-full rounded-xl border border-stone-200/80 bg-white p-1 shadow-inner shadow-stone-100"
                />
                <div
                  id="payment-widget-agreement"
                  className="mt-6 w-full rounded-xl border border-stone-100 bg-stone-50/30 p-2"
                />
              </>
            )}
          </section>

          {payError != null ? (
            <p className="rounded-lg bg-amber-50 px-4 py-2 text-center text-sm text-amber-950 ring-1 ring-amber-200/80">
              {payError}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              disabled={!ready || paying || initError != null}
              onClick={() => void handlePay()}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-950 px-8 py-4 text-base font-bold text-amber-100 shadow-lg shadow-emerald-950/25 transition hover:from-emerald-700 hover:to-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paying ? "결제 창으로 이동 중…" : `${formatKrw(MOCRA_CHECKOUT_AMOUNT_KRW)} 결제하기`}
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-emerald-950/20 bg-white px-6 py-4 text-sm font-semibold text-emerald-950 transition hover:bg-stone-50"
            >
              취소하고 돌아가기
            </Link>
          </div>

          <p className="text-center text-[11px] leading-relaxed text-zinc-500">
            결제는 토스페이먼츠를 통해 처리됩니다. 테스트 키 사용 시 실제
            승인되지 않을 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
