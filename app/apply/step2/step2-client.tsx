"use client";

import { saveApplyProductAction } from "@/app/apply/save-product-action";
import { fdaCategories } from "@/app/fdaCategories";
import { AgreementModal } from "@/components/apply/agreement-modal";
import { ApplyFooter } from "@/components/apply/apply-footer";
import { IconShoppingCart } from "@/components/apply/icon-cart";
import { ApplyStepper } from "@/components/apply/apply-stepper";
import { Ag, ApplyFieldLabel } from "@/components/apply/field-label";
import { RegisterAiTrustStrip } from "@/components/apply/register-ai-trust-strip";
import { AicraHeader } from "@/components/aicra-header";
import {
  AI_CATEGORY_QUERY_REGEX,
  FAKE_OCR_TEXT,
  pathLabelFrom,
  RP_PRODUCT_NAME_REGEX,
} from "@/lib/apply/types-and-constants";
import { APPLY_SAVE_PRODUCT_FIELD } from "@/lib/apply/save-product-server-validation";
import { useApplyStore } from "@/stores/apply-store";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApplyCardHeader, ApplyShell } from "../apply-shell";

const kb = "break-keep text-balance" as const;

type OcrReviewState = "idle" | "needs_review" | "reviewed";

export function Step2Client() {
  const router = useRouter();
  const ocrTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productSectionRef = useRef<HTMLDivElement | null>(null);
  const cartSuccessModalPanelRef = useRef<HTMLDivElement | null>(null);
  const ingredientTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const prevOcrProcessingRef = useRef(false);
  const [cartSuccessModal, setCartSuccessModal] = useState<
    null | "add" | "edit"
  >(null);
  const [ocrReviewState, setOcrReviewState] = useState<OcrReviewState>("idle");
  const [searchError, setSearchError] = useState<string | null>(null);

  const s = useApplyStore();

  const handleAddAnotherProduct = useCallback(() => {
    useApplyStore.getState().clearProductZoneB();
    setCartSuccessModal(null);
    window.setTimeout(() => {
      document
        .getElementById("step2-container")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const handleGoToCartList = useCallback(() => {
    useApplyStore.getState().clearProductZoneB();
    setCartSuccessModal(null);
    router.push("/apply/step3");
  }, [router]);

  useEffect(() => {
    return () => {
      if (ocrTimeoutRef.current != null) clearTimeout(ocrTimeoutRef.current);
    };
  }, []);

  /** OCR이 끝나 텍스트가 채워진 직후: 검토 단계(파란 강조) */
  useEffect(() => {
    if (!s.showIngredientTextarea) {
      setOcrReviewState("idle");
      prevOcrProcessingRef.current = s.ocrProcessing;
      return;
    }
    if (s.isIngredientConfirmed) {
      setOcrReviewState("idle");
      prevOcrProcessingRef.current = s.ocrProcessing;
      return;
    }
    const finishedRun =
      prevOcrProcessingRef.current === true && s.ocrProcessing === false;
    prevOcrProcessingRef.current = s.ocrProcessing;
    if (finishedRun && s.ingredientText.trim() !== "") {
      setOcrReviewState("needs_review");
    }
  }, [
    s.showIngredientTextarea,
    s.isIngredientConfirmed,
    s.ocrProcessing,
    s.ingredientText,
  ]);

  useEffect(() => {
    if (s.ocrProcessing) setOcrReviewState("idle");
  }, [s.ocrProcessing]);

  /** 성공 모달: ESC로 닫기 방지(명시적 버튼만 허용) */
  useEffect(() => {
    if (cartSuccessModal == null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [cartSuccessModal]);

  /** 모달이 열린 동안 배경 스크롤 방지 */
  useEffect(() => {
    if (cartSuccessModal == null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [cartSuccessModal]);

  /** 성공 모달: Tab 포커스를 패널 안에 가둠 */
  useEffect(() => {
    if (cartSuccessModal == null) return;
    const root = cartSuccessModalPanelRef.current;
    if (root == null) return;

    const getFocusable = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
        ),
      ).filter((el) => el.getClientRects().length > 0);

    const focusables = getFocusable();
    if (focusables.length === 0) return;
    const first = focusables[0];
    queueMicrotask(() => first.focus());

    const onFocusInCapture = (e: FocusEvent) => {
      const t = e.target as Node | null;
      if (t != null && root.contains(t)) return;
      first.focus();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = getFocusable();
      if (list.length === 0) return;
      const f = list[0];
      const l = list[list.length - 1];
      const ae = document.activeElement;
      if (e.shiftKey) {
        if (ae === f) {
          e.preventDefault();
          l.focus();
        }
      } else if (ae === l) {
        e.preventDefault();
        f.focus();
      }
    };

    document.addEventListener("focusin", onFocusInCapture, true);
    root.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("focusin", onFocusInCapture, true);
      root.removeEventListener("keydown", onKeyDown);
    };
  }, [cartSuccessModal]);

  const l1Node = useMemo(
    () => fdaCategories.find((n) => n.value === s.category1) ?? null,
    [s.category1],
  );
  const l2Options = l1Node?.children ?? [];
  const l2Node = useMemo(
    () => l2Options.find((n) => n.value === s.category2) ?? null,
    [l2Options, s.category2],
  );
  const l3Options = l2Node?.children ?? [];

  const invalidFieldClass =
    "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200";
  const normalFieldClass =
    "border-zinc-200 ring-zinc-400 focus:border-zinc-300 focus:ring-2";

  const isEditingProduct = s.editingId != null;

  const handleAiSearchClick = useCallback(async () => {
    const st = useApplyStore.getState();
    if (st.aiCategoryQuery.trim() === "") {
      alert("검색할 제품 종류를 입력해 주세요.");
      return;
    }
    if (st.aiCategoryQueryError) {
      alert(
        "입력 형식에 오류가 있는 항목이 있습니다. 빨간색 안내 문구를 확인해주세요.",
      );
      return;
    }
    setSearchError(null);
    st.setAiRecommendation(null);
    st.setAiSearchLoading(true);
    try {
      const res = await fetch("/api/recommend-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: st.aiCategoryQuery }),
      });
      const data = (await res.json()) as {
        category1?: string;
        category2?: string;
        category3?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      const c1 = data.category1 ?? "";
      const c2 = data.category2 ?? "";
      const c3 = data.category3 ?? "";
      useApplyStore.getState().setAiRecommendation({
        pathLabel: pathLabelFrom(c1, c2, c3),
        category1: c1,
        category2: c2,
        category3: c3,
      });
      alert(
        "Aicra가 적절한 카테고리를 추천했습니다. 정확한지 한 번 더 확인하고 필요시 직접 수정해 주세요.",
      );
    } catch (err) {
      console.error(err);
      setSearchError(
        "검색 중 오류가 발생했습니다. 다시 시도해 주세요.",
      );
    } finally {
      useApplyStore.getState().setAiSearchLoading(false);
    }
  }, []);

  const handleIngredientImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (ocrTimeoutRef.current != null) {
        clearTimeout(ocrTimeoutRef.current);
        ocrTimeoutRef.current = null;
      }
      if (!file) {
        s.setIngredientFileMeta(null);
        s.setOcrProcessing(false);
        s.setIsIngredientConfirmed(false);
        return;
      }
      s.setIsIngredientConfirmed(false);
      s.setIngredientFileMeta({
        name: file.name,
        size: file.size,
        type: file.type,
      });
      s.clearProductFieldKey("ingredientImage");
      s.setOcrProcessing(true);
      ocrTimeoutRef.current = setTimeout(() => {
        ocrTimeoutRef.current = null;
        const st = useApplyStore.getState();
        st.setOcrProcessing(false);
        st.setIngredientText(FAKE_OCR_TEXT);
        st.setShowIngredientTextarea(true);
        st.setIsIngredientConfirmed(false);
      }, 2000);
    },
    [s],
  );

  const handleLabelImagesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (list == null || list.length === 0) {
        e.target.value = "";
        return;
      }
      const newFiles = Array.from(list);
      s.setLabelFiles((prev) => {
        if (prev.length + newFiles.length > 4) {
          alert("영문 패키지 사진은 최대 4장까지만 업로드할 수 있습니다.");
          return prev;
        }
        const merged = [...prev, ...newFiles];
        if (merged.length > prev.length) {
          queueMicrotask(() => s.clearProductFieldKey("labels"));
        }
        return merged;
      });
      e.target.value = "";
    },
    [s],
  );

  const removeLabelFile = useCallback(
    (index: number) => {
      s.setLabelFiles((prev) => {
        const next = prev.filter((_, i) => i !== index);
        if (next.length > 0) {
          queueMicrotask(() => s.clearProductFieldKey("labels"));
        }
        return next;
      });
    },
    [s],
  );

  const runAddOrEdit = useCallback(async () => {
    const st = useApplyStore.getState();
    const commonErr: Record<string, boolean> = {};
    if (!st.isAgreed) commonErr.agreement = true;
    else {
      if (st.rpNameEn.trim() === "") commonErr.rpNameEn = true;
      if (st.rpContact.trim() === "") commonErr.rpContact = true;
      if (st.applicantName.trim() === "") commonErr.applicantName = true;
      if (st.applicantPhone.trim() === "") commonErr.applicantPhone = true;
      if (st.applicantEmail.trim() === "") commonErr.applicantEmail = true;
    }
    const nextErr: Record<string, boolean> = {};
    if (st.productNameEn.trim() === "" || st.productNameEnError) {
      nextErr.productNameEn = true;
    }
    if (st.category1 === "" || st.category2 === "" || st.category3 === "") {
      nextErr.category = true;
    }
    if (st.feiNumber.trim() === "") nextErr.fei = true;
    if (st.editingId == null) {
      if (st.labelFiles.length === 0) nextErr.labels = true;
      if (st.ingredientFileMeta === null) nextErr.ingredientImage = true;
    }
    if (st.ingredientText.trim() === "") nextErr.ingredientText = true;
    if (!st.isIngredientConfirmed) nextErr.ingredientConfirm = true;

    const hasCommon = Object.keys(commonErr).length > 0;
    const hasProduct = Object.keys(nextErr).length > 0;
    if (hasCommon || hasProduct) {
      st.setCommonRequiredError(commonErr);
      st.setProductFieldError(nextErr);
      alert(
        hasCommon && hasProduct
          ? "공통 정보와 제품 정보의 빨간 테두리 항목을 모두 확인해 주세요."
          : hasCommon
            ? "1단계 공통 정보(동의·RP·신청자)를 먼저 완료해 주세요."
            : "제품 정보 빨간 테두리 항목을 확인해 주세요.",
      );
      return;
    }
    if (st.rpNameEnError || st.rpContactError) {
      alert("입력 형식 오류가 있습니다. RP 항목을 확인해 주세요.");
      return;
    }
    if (
      st.nameError !== "" ||
      st.phoneError !== "" ||
      st.emailError !== ""
    ) {
      alert("신청자 정보 형식을 확인해 주세요.");
      return;
    }
    if (st.aiCategoryQueryError) {
      alert("카테고리 검색 입력 형식을 확인해 주세요.");
      return;
    }

    const sessionId = st.sessionId.trim();
    if (sessionId === "") {
      alert(
        "브라우저 세션을 확인할 수 없습니다. 페이지를 새로고침 후 다시 시도해 주세요.",
      );
      return;
    }

    const files = [...st.labelFiles];

    if (st.editingId != null) {
      const line = st.cartLines.find((c) => c.id === st.editingId);
      if (line == null) {
        alert("수정 대상을 찾을 수 없습니다.");
        st.setEditingId(null);
        st.clearProductZoneB();
        return;
      }
      const hasNewLabels = files.length > 0;
      const hasExistingLabels = line.labelImageUrl.trim() !== "";
      if (!hasNewLabels && !hasExistingLabels) {
        st.setProductFieldError((p) => ({ ...p, labels: true }));
        alert("라벨 이미지는 필수입니다.");
        return;
      }
      const lineSession = line.sessionId.trim();
      if (lineSession === "" || lineSession !== sessionId) {
        alert(
          "이 제품은 현재 브라우저 세션과 맞지 않습니다. 목록을 확인하거나 페이지를 새로고침해 주세요.",
        );
        return;
      }
    }

    st.setIsAddingProduct(true);
    try {
      const F = APPLY_SAVE_PRODUCT_FIELD;
      const fd = new FormData();
      fd.append(F.sessionId, sessionId);
      fd.append(F.editingId, st.editingId ?? "");
      fd.append(F.isAgreed, st.isAgreed ? "1" : "");
      if (st.editingId == null) {
        fd.append(
          F.hasIngredientImage,
          st.ingredientFileMeta != null ? "1" : "",
        );
      }
      fd.append(F.ingredientConfirmed, st.isIngredientConfirmed ? "1" : "");
      fd.append(F.rpNameEn, st.rpNameEn.trim());
      fd.append(F.rpContact, st.rpContact.trim());
      fd.append(F.agentName, st.agentName);
      fd.append(F.applicantName, st.applicantName.trim());
      fd.append(F.applicantPhone, st.applicantPhone.trim());
      fd.append(F.applicantEmail, st.applicantEmail.trim());
      fd.append(F.productNameEn, st.productNameEn.trim());
      fd.append(F.feiNumber, st.feiNumber.trim());
      fd.append(F.category1, st.category1);
      fd.append(F.category2, st.category2);
      fd.append(F.category3, st.category3);
      fd.append(F.ingredientText, st.ingredientText.trim());
      fd.append(F.aiCategoryQuery, st.aiCategoryQuery.trim());
      for (const file of files) {
        fd.append(F.labels, file);
      }

      const res = await saveApplyProductAction(fd);
      if (!res.ok) {
        alert(res.error);
        return;
      }

      if (res.mode === "edit") {
        st.setCartLines((prev) =>
          prev.map((c) => (c.id === res.cartLine.id ? res.cartLine : c)),
        );
        st.setEditingId(null);
        setCartSuccessModal("edit");
      } else {
        st.setCartLines((prev) => [...prev, res.cartLine]);
        setCartSuccessModal("add");
      }
      st.setCommonRequiredError({});
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "저장 중 오류가 발생했습니다. 네트워크와 설정을 확인한 뒤 다시 시도해 주세요.",
      );
    } finally {
      st.setIsAddingProduct(false);
    }
  }, [setCartSuccessModal]);

  return (
    <ApplyShell>
      <AicraHeader page="register" />
      <div className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-lg shadow-emerald-950/5 ring-1 ring-amber-200/50">
          <ApplyCardHeader />
          <div
            id="step2-container"
            className="scroll-mt-24 p-6 sm:p-8 sm:scroll-mt-28"
          >
            <ApplyStepper activeStep={2} />
            <RegisterAiTrustStrip />
            <p className="mb-2 text-sm text-gray-600">
              2단계: 등록할 제품별 상세 정보를 입력한 뒤 목록 확인 단계로
              이동합니다.
            </p>

            <section
              ref={productSectionRef}
              className={`mt-6 space-y-5 rounded-xl border p-5 shadow-sm ${
                isEditingProduct
                  ? "border-amber-300/90 bg-amber-50/30 ring-1 ring-amber-200/60"
                  : "border-amber-100 bg-white"
              }`}
            >
              {isEditingProduct ? (
                <p className="rounded-lg border border-amber-400 bg-amber-100/90 px-3 py-2 text-sm font-medium text-amber-950">
                  제품 수정 중입니다. 하단「저장하고 다음 단계로」로 반영하거나
                  수정 취소를 누르세요.
                </p>
              ) : null}

              <div>
                <ApplyFieldLabel
                  htmlFor="apply-product-name-en"
                  tooltip="패키지나 라벨에 표기된 영문 제품명과 정확히 동일해야 합니다."
                >
                  영문 제품명
                </ApplyFieldLabel>
                <input
                  id="apply-product-name-en"
                  type="text"
                  value={s.productNameEn}
                  onChange={(e) => {
                    const v = e.target.value;
                    s.clearProductFieldKey("productNameEn");
                    s.setProductNameEn(v);
                    s.setProductNameEnError(
                      v.length > 0 && !RP_PRODUCT_NAME_REGEX.test(v),
                    );
                  }}
                  disabled={s.isAddingProduct}
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-shadow placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50 ${
                    s.productFieldError.productNameEn === true ||
                    s.productNameEnError
                      ? invalidFieldClass
                      : normalFieldClass
                  }`}
                  placeholder="라벨과 동일한 영문명"
                />
                {s.productNameEnError ? (
                  <p className="mt-1 text-sm text-red-500">
                    영문/숫자 및 특정 특수기호만 입력 가능합니다.
                  </p>
                ) : null}
              </div>

              <div>
                <ApplyFieldLabel htmlFor="apply-ai-cat">
                  <span className="text-base font-semibold text-zinc-900">
                    제품 카테고리 (<Ag>Aicra</Ag> 빠른 카테고리 찾기)
                  </span>
                </ApplyFieldLabel>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    id="apply-ai-cat"
                    type="text"
                    value={s.aiCategoryQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      s.setAiCategoryQuery(v);
                      s.setAiCategoryQueryError(
                        v.length > 0 && !AI_CATEGORY_QUERY_REGEX.test(v),
                      );
                    }}
                    disabled={s.isAddingProduct}
                    className={`min-w-0 flex-1 rounded-xl border-2 bg-stone-50/80 px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-zinc-500 focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-amber-400/25 disabled:opacity-60 ${
                      s.aiCategoryQueryError
                        ? "border-red-500 ring-2 ring-red-200"
                        : "border-emerald-800/40 ring-emerald-900/15"
                    }`}
                    placeholder="예: 토너, 수분크림…"
                  />
                  <button
                    type="button"
                    onClick={() => void handleAiSearchClick()}
                    disabled={s.aiSearchLoading || s.isAddingProduct}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-emerald-950 px-5 py-3 text-sm font-semibold text-stone-50 shadow-sm transition-colors hover:bg-emerald-900 disabled:opacity-60"
                  >
                    {s.aiSearchLoading ? (
                      <>
                        <span
                          className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-stone-400/40 border-t-amber-200"
                          aria-hidden
                        />
                        검색 중...
                      </>
                    ) : (
                      "검색"
                    )}
                  </button>
                </div>
                {s.aiCategoryQueryError ? (
                  <p className="mt-1 text-sm text-red-500">
                    특수기호는 제한됩니다.
                  </p>
                ) : null}
                {s.aiSearchLoading ||
                s.aiRecommendation != null ||
                searchError != null ? (
                  <div
                    className={`mt-3 flex min-h-[7.5rem] flex-col rounded-lg border border-amber-100 bg-stone-50 px-3 py-2.5 text-sm text-zinc-800 ${
                      s.aiSearchLoading || searchError != null
                        ? "items-center justify-center"
                        : ""
                    }`}
                  >
                    {s.aiSearchLoading ? (
                      <div
                        className="flex flex-col items-center justify-center gap-2"
                        role="status"
                        aria-live="polite"
                      >
                        <span
                          className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-emerald-900/20 border-t-amber-400"
                          aria-hidden
                        />
                        <p
                          className={`text-center font-medium text-emerald-900/75 animate-pulse ${kb}`}
                        >
                          AI가 찾고 있습니다...
                        </p>
                      </div>
                    ) : searchError != null ? (
                      <div
                        className={`flex max-w-full items-start gap-2 text-left ${kb}`}
                        role="alert"
                      >
                        <svg
                          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-sm font-medium text-amber-900">
                          {searchError}
                        </p>
                      </div>
                    ) : s.aiRecommendation != null ? (
                      <>
                        <p>
                          <span className="font-semibold text-emerald-900">
                            추천 결과:
                          </span>{" "}
                          {s.aiRecommendation.pathLabel}
                        </p>
                        <button
                          type="button"
                          disabled={s.isAddingProduct}
                          onClick={() => {
                            if (s.aiRecommendation == null) return;
                            s.setCategory1(s.aiRecommendation.category1);
                            s.setCategory2(s.aiRecommendation.category2);
                            s.setCategory3(s.aiRecommendation.category3);
                            s.setAiRecommendation(null);
                            s.clearProductFieldKey("category");
                          }}
                          className="mt-2 w-full rounded-lg bg-emerald-950 py-2 text-sm font-semibold text-stone-50 hover:bg-emerald-900 disabled:opacity-60 sm:w-auto sm:px-4"
                        >
                          선택
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}

                <div
                  className={`mt-6 grid grid-cols-1 gap-3 rounded-lg sm:grid-cols-3 ${
                    s.productFieldError.category === true
                      ? "p-2 ring-2 ring-red-400 ring-offset-2"
                      : ""
                  }`}
                >
                  <div>
                    <label
                      htmlFor="apply-cat-1"
                      className="mb-1 block text-xs font-medium text-zinc-500"
                    >
                      1단계 (대분류)
                    </label>
                    <select
                      id="apply-cat-1"
                      value={s.category1}
                      onChange={(e) => {
                        s.setCategory1(e.target.value);
                        s.clearProductFieldKey("category");
                      }}
                      disabled={s.isAddingProduct}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 disabled:bg-zinc-50"
                    >
                      <option value="">선택</option>
                      {fdaCategories.map((n) => (
                        <option key={n.value} value={n.value}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="apply-cat-2"
                      className="mb-1 block text-xs font-medium text-zinc-500"
                    >
                      2단계 (중분류)
                    </label>
                    <select
                      id="apply-cat-2"
                      value={s.category2}
                      onChange={(e) => {
                        s.setCategory2(e.target.value);
                        s.clearProductFieldKey("category");
                      }}
                      disabled={s.category1 === "" || s.isAddingProduct}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 disabled:bg-zinc-50"
                    >
                      <option value="">
                        {s.category1 === "" ? "1단계를 먼저 선택" : "선택"}
                      </option>
                      {l2Options.map((n) => (
                        <option key={n.value} value={n.value}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="apply-cat-3"
                      className="mb-1 block text-xs font-medium text-zinc-500"
                    >
                      3단계 (소분류)
                    </label>
                    <select
                      id="apply-cat-3"
                      value={s.category3}
                      onChange={(e) => {
                        s.clearProductFieldKey("category");
                        s.setCategory3(e.target.value);
                      }}
                      disabled={s.category2 === "" || s.isAddingProduct}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 disabled:bg-zinc-50"
                    >
                      <option value="">
                        {s.category2 === "" ? "2단계를 먼저 선택" : "선택"}
                      </option>
                      {l3Options.map((n) => (
                        <option key={n.value} value={n.value}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="apply-fei"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  제조사 FEI 번호
                </label>
                <input
                  id="apply-fei"
                  inputMode="numeric"
                  maxLength={10}
                  value={s.feiNumber}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const digitsOnly = raw.replace(/[^0-9]/g, "");
                    const sanitized = digitsOnly.slice(0, 10);
                    if (raw !== digitsOnly) {
                      s.setFeiError("FEI 번호는 숫자만 입력 가능합니다.");
                    } else if (raw.length > 10) {
                      s.setFeiError("FEI 번호는 10자리까지만 입력 가능합니다.");
                    } else {
                      s.setFeiError("");
                      if (sanitized.length > 0) s.clearProductFieldKey("fei");
                    }
                    s.setFeiNumber(sanitized);
                  }}
                  disabled={s.isAddingProduct}
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none disabled:bg-zinc-50 ${
                    s.productFieldError.fei === true || s.feiError !== ""
                      ? invalidFieldClass
                      : normalFieldClass
                  }`}
                  placeholder="숫자 10자리 입력"
                />
                {s.feiError ? (
                  <p className="mt-1 text-xs text-red-500">{s.feiError}</p>
                ) : null}
              </div>

              <div
                className={
                  s.productFieldError.labels === true
                    ? "rounded-lg p-2 ring-2 ring-red-400 ring-offset-1"
                    : ""
                }
              >
                <ApplyFieldLabel
                  htmlFor={
                    s.labelFiles.length < 4 ? "apply-labels" : undefined
                  }
                  tooltip="제품의 앞/뒷면 라벨 및 패키지 사진을 모두 업로드해 주세요."
                >
                  영문 패키지 or 라벨 사진
                </ApplyFieldLabel>
                {s.labelFiles.length < 4 ? (
                  <input
                    id="apply-labels"
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={s.isAddingProduct}
                    onChange={handleLabelImagesChange}
                    className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:font-medium file:text-zinc-800 hover:file:bg-zinc-200 disabled:opacity-50"
                  />
                ) : (
                  <p className="text-sm text-zinc-500">
                    최대 4장입니다. 삭제 후 다시 추가할 수 있습니다.
                  </p>
                )}
                {s.labelFiles.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {s.labelFiles.map((f, index) => (
                      <li
                        key={`${f.name}-${index}-${f.size}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate">{f.name}</span>
                        <button
                          type="button"
                          disabled={s.isAddingProduct}
                          onClick={() => removeLabelFile(index)}
                          className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div
                className={
                  s.productFieldError.ingredientImage === true
                    ? "rounded-lg p-2 ring-2 ring-red-400 ring-offset-1"
                    : ""
                }
              >
                <ApplyFieldLabel
                  htmlFor="apply-ingredient"
                  tooltip="성분표 이미지를 업로드하면 분석 결과가 표시됩니다. 반드시 확인·수정해 주세요."
                >
                  성분표 이미지 (Aicra 인텔리전스)
                </ApplyFieldLabel>
                <input
                  id="apply-ingredient"
                  type="file"
                  accept="image/*"
                  disabled={s.isAddingProduct}
                  onChange={handleIngredientImageChange}
                  className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:font-medium file:text-zinc-800 hover:file:bg-zinc-200 disabled:opacity-50"
                />
                {s.ocrProcessing ? (
                  <div
                    className="mt-3 flex items-center gap-2 text-sm text-zinc-600"
                    role="status"
                  >
                    <span
                      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-700"
                      aria-hidden
                    />
                    <span className={`font-bold text-emerald-950 ${kb}`}>
                      성분 정보를 분석하는 중...
                    </span>
                  </div>
                ) : null}
                {s.showIngredientTextarea ? (
                  <div className="mt-3">
                    <label
                      htmlFor="apply-ingredient-text"
                      className="mb-1.5 block text-xs font-medium text-zinc-500"
                    >
                      분석 결과 · 직접 수정 가능
                    </label>
                    <textarea
                      ref={ingredientTextareaRef}
                      id="apply-ingredient-text"
                      value={s.ingredientText}
                      onChange={(e) => {
                        s.clearProductFieldKey("ingredientText");
                        s.clearProductFieldKey("ingredientConfirm");
                        s.setIngredientText(e.target.value);
                        s.setIsIngredientConfirmed(false);
                        setOcrReviewState("reviewed");
                      }}
                      onFocus={() => {
                        setOcrReviewState((prev) =>
                          prev === "needs_review" ? "reviewed" : prev,
                        );
                      }}
                      rows={5}
                      disabled={s.isAddingProduct}
                      className={`w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm outline-none disabled:bg-zinc-50 ${
                        s.productFieldError.ingredientText === true
                          ? invalidFieldClass
                          : ocrReviewState === "needs_review"
                            ? "border-2 border-blue-500 ring-2 ring-blue-200/90 focus:border-blue-600 focus:ring-blue-300"
                            : ocrReviewState === "reviewed"
                              ? "border-zinc-200 ring-1 ring-zinc-200/80 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-300"
                              : normalFieldClass
                      }`}
                    />
                    {ocrReviewState === "needs_review" ? (
                      <p
                        className={`mt-2 text-sm font-medium text-blue-600 ${kb}`}
                      >
                        👉 OCR로 읽어온 영문 성분명입니다. 이미지를 보고 오타가
                        있다면 네모박스 안을 클릭해 수정해 주세요. 수정을 마치면
                        아래 [성분표 확인] 버튼을 눌러주세요.
                      </p>
                    ) : null}
                    <div
                      className={
                        s.productFieldError.ingredientConfirm === true &&
                        ocrReviewState !== "needs_review"
                          ? "mt-2 inline-block rounded-lg p-1 ring-2 ring-red-400"
                          : "mt-2"
                      }
                    >
                      <button
                        type="button"
                        disabled={s.isAddingProduct}
                        onClick={() => {
                          setOcrReviewState("idle");
                          s.setIsIngredientConfirmed(true);
                          s.clearProductFieldKey("ingredientConfirm");
                        }}
                        className={`w-full rounded-lg border bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-200 disabled:opacity-60 sm:w-auto sm:px-6 ${
                          ocrReviewState === "reviewed" &&
                          !s.isIngredientConfirmed
                            ? "animate-pulse border-2 border-green-500 ring-2 ring-green-200/90"
                            : "border-zinc-300"
                        }`}
                      >
                        성분표 확인
                      </button>
                    </div>
                    {s.isIngredientConfirmed ? (
                      <p className="mt-1.5 text-xs font-medium text-emerald-700">
                        성분표 내용 확인이 완료되었습니다.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {isEditingProduct ? (
                <button
                  type="button"
                  disabled={s.isAddingProduct}
                  onClick={() => s.clearProductZoneB()}
                  className="w-full rounded-xl border-2 border-zinc-300 bg-white py-3 text-sm font-semibold text-zinc-800 hover:bg-stone-50 disabled:opacity-60"
                >
                  수정 취소
                </button>
              ) : null}
            </section>

            <ApplyFooter
              showPrev
              prevHref="/apply/step1"
              nextLabel={
                s.editingId != null ? "목록에 반영하기" : "목록에 추가하기"
              }
              hideNextArrow
              nextLeading={
                <IconShoppingCart className="h-5 w-5 text-amber-200" />
              }
              onNext={() => void runAddOrEdit()}
              nextDisabled={s.isAddingProduct}
            />
          </div>
        </div>
      </div>

      {cartSuccessModal != null ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-success-title"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <div
            ref={cartSuccessModalPanelRef}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-200/60 bg-white shadow-2xl shadow-emerald-950/20"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="border-b border-amber-100 bg-gradient-to-r from-emerald-900 to-emerald-950 px-6 py-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-300/20 ring-2 ring-amber-300/50">
                <IconShoppingCart className="h-7 w-7 text-amber-200" />
              </div>
              <h2
                id="cart-success-title"
                className={`mt-4 text-lg font-bold text-amber-50 sm:text-xl ${kb}`}
              >
                {cartSuccessModal === "add"
                  ? "제품이 성공적으로 목록에 추가되었습니다."
                  : "수정한 내용이 목록에 반영되었습니다."}
              </h2>
            </div>
            <div className="px-6 py-6">
              <p className={`text-center text-sm leading-relaxed text-zinc-600 ${kb}`}>
                {cartSuccessModal === "add"
                  ? "같은 접수로 다른 제품을 더 담거나, 지금까지 담은 목록을 확인할 수 있습니다."
                  : "목록에서 내용을 확인하거나, 이어서 다른 제품을 추가해 주세요."}
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <button
                  type="button"
                  onClick={handleAddAnotherProduct}
                  className="inline-flex w-full items-center justify-center rounded-xl border-2 border-zinc-300 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-stone-50 sm:w-auto sm:min-w-[10rem]"
                >
                  다른 제품 추가하기
                </button>
                <button
                  type="button"
                  onClick={handleGoToCartList}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-950 px-6 py-3.5 text-sm font-bold text-amber-100 shadow-lg transition hover:bg-emerald-900 sm:w-auto sm:min-w-[10rem]"
                >
                  등록 목록 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AgreementModal />
    </ApplyShell>
  );
}
