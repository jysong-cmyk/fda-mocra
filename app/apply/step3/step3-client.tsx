"use client";

import { ApplyFooter } from "@/components/apply/apply-footer";
import { ApplyStepper } from "@/components/apply/apply-stepper";
import { RegisterAiTrustStrip } from "@/components/apply/register-ai-trust-strip";
import { AicraHeader } from "@/components/aicra-header";
import { deleteCartLineWithStorageCleanup } from "@/lib/apply/delete-cart-line";
import { pathLabelFrom, type CartLine } from "@/lib/apply/types-and-constants";
import { useApplyStore } from "@/stores/apply-store";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ApplyCardHeader, ApplyShell } from "../apply-shell";

const kb = "break-keep text-balance" as const;

export function Step3Client() {
  const router = useRouter();
  const cartLines = useApplyStore((s) => s.cartLines);
  const clearProductZoneB = useApplyStore((s) => s.clearProductZoneB);
  const setEditingId = useApplyStore((s) => s.setEditingId);
  const fillProductFormFromLine = useApplyStore((s) => s.fillProductFormFromLine);
  const hydrateCommonFromCartLine = useApplyStore(
    (s) => s.hydrateCommonFromCartLine,
  );
  const setCartLines = useApplyStore((s) => s.setCartLines);
  const applySessionId = useApplyStore((s) => s.sessionId);

  const handleAddProduct = useCallback(() => {
    setEditingId(null);
    clearProductZoneB();
    router.push("/apply/step2");
  }, [clearProductZoneB, router, setEditingId]);

  const handleEdit = useCallback(
    (line: CartLine) => {
      hydrateCommonFromCartLine(line);
      fillProductFormFromLine(line);
      setEditingId(line.id);
      router.push("/apply/step2");
    },
    [
      fillProductFormFromLine,
      hydrateCommonFromCartLine,
      router,
      setEditingId,
    ],
  );

  const handleDelete = useCallback(
    async (line: CartLine) => {
      if (
        !window.confirm(
          "목록에서 이 제품을 삭제할까요? 삭제 후에는 복구할 수 없습니다.",
        )
      ) {
        return;
      }
      const { error: delErr } = await deleteCartLineWithStorageCleanup(
        line,
        applySessionId,
      );
      if (delErr != null) {
        alert(
          `${delErr}\n\n권한(RLS) 또는 네트워크를 확인해 주세요.`,
        );
        return;
      }
      setCartLines((prev) => prev.filter((x) => x.id !== line.id));
      const st = useApplyStore.getState();
      if (st.editingId === line.id) {
        setEditingId(null);
        clearProductZoneB();
      }
    },
    [applySessionId, clearProductZoneB, setCartLines, setEditingId],
  );

  return (
    <ApplyShell>
      <AicraHeader page="register" />
      <div className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-lg shadow-emerald-950/5 ring-1 ring-amber-200/50">
          <ApplyCardHeader />
          <div className="p-6 sm:p-8">
            <ApplyStepper activeStep={3} />
            <RegisterAiTrustStrip />
            <p className={`mb-4 text-sm text-gray-600 ${kb}`}>
              3단계: 등록 목록을 확인하세요. 제품을 더 넣으려면「제품
              추가하기」로 2단계로 돌아갑니다.
            </p>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-emerald-950">
                등록 예정 제품 ({cartLines.length}건)
              </h2>
              <p className="mt-1 text-xs text-zinc-600">
                장바구니처럼 담긴 SKU입니다. 결제 전에 내용을 다시 확인해
                주세요.
              </p>
              {cartLines.length > 0 ? (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="inline-flex items-center justify-center rounded-xl border-2 border-emerald-800/40 bg-emerald-950/5 px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-950/10"
                  >
                    + 제품 추가하기
                  </button>
                </div>
              ) : null}
            </div>

            {cartLines.length === 0 ? (
              <div className="flex min-h-[min(22rem,50vh)] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-400/50 bg-gradient-to-b from-amber-50/90 to-stone-50/80 px-6 py-16 text-center shadow-inner">
                <p className={`text-base font-semibold text-emerald-950 sm:text-lg ${kb}`}>
                  아직 등록할 제품이 없습니다
                </p>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-600">
                  2단계에서 제품 정보를 입력하고 저장하면 여기 목록에
                  표시됩니다.
                </p>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className={`mt-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-10 py-5 text-lg font-bold text-amber-100 shadow-xl shadow-emerald-950/25 transition hover:bg-emerald-900 hover:shadow-emerald-950/35 ${kb}`}
                >
                  <span className="text-2xl font-light leading-none" aria-hidden>
                    +
                  </span>
                  등록할 제품 추가하기
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {cartLines.map((line) => (
                  <li
                    key={line.id}
                    className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-stone-50/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-900">
                        <span className="break-words">{line.productNameEn}</span>
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                        {pathLabelFrom(
                          line.category1,
                          line.category2,
                          line.category3,
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        FEI {line.feiNumber}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(line)}
                        className="rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(line)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <ApplyFooter
              showPrev
              prevHref="/apply/step2"
              paymentMode
              paymentDisabled={cartLines.length === 0}
            />
          </div>
        </div>
      </div>
    </ApplyShell>
  );
}
