"use client";

import { fdaCategories } from "@/app/fdaCategories";
import { AgreementModal } from "@/components/apply/agreement-modal";
import { ApplyFooter } from "@/components/apply/apply-footer";
import { ApplyStepper } from "@/components/apply/apply-stepper";
import { Ag, ApplyFieldLabel } from "@/components/apply/field-label";
import { RegisterAiTrustStrip } from "@/components/apply/register-ai-trust-strip";
import { AicraHeader } from "@/components/aicra-header";
import {
  AI_CATEGORY_QUERY_REGEX,
  FAKE_OCR_TEXT,
  pathLabelFrom,
  RP_PRODUCT_NAME_REGEX,
  type CartLine,
} from "@/lib/apply/types-and-constants";
import { uploadLabelFiles } from "@/lib/apply/upload-labels";
import { supabase } from "@/lib/supabase";
import { useApplyStore } from "@/stores/apply-store";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ApplyCardHeader, ApplyShell } from "../apply-shell";

const kb = "break-keep text-balance" as const;

export function Step2Client() {
  const router = useRouter();
  const ocrTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productSectionRef = useRef<HTMLDivElement | null>(null);

  const s = useApplyStore();

  useEffect(() => {
    return () => {
      if (ocrTimeoutRef.current != null) clearTimeout(ocrTimeoutRef.current);
    };
  }, []);

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
      alert(
        err instanceof Error
          ? err.message
          : "카테고리 추천 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
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

    const applicantNameTrim = st.applicantName.trim();
    const applicantPhoneTrim = st.applicantPhone.trim();
    const applicantEmailTrim = st.applicantEmail.trim();
    const recommender = st.agentName.replace(/\s+/g, "");
    const productNameEnTrim = st.productNameEn.trim();
    const feiTrim = st.feiNumber.trim();
    const ingredientTrim = st.ingredientText.trim();
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
      st.setIsAddingProduct(true);
      try {
        let labelImageUrlFinal = line.labelImageUrl;
        if (hasNewLabels) {
          const urls = await uploadLabelFiles(files);
          labelImageUrlFinal = urls.length > 0 ? urls.join(", ") : "";
        }
        const { error: updateError } = await supabase
          .from("products")
          .update({
            rp_name_en: st.rpNameEn.trim(),
            rp_contact: st.rpContact.trim(),
            product_name_en: productNameEnTrim,
            fei_number: feiTrim,
            category1: st.category1,
            category2: st.category2,
            category3: st.category3,
            ingredient_text: ingredientTrim,
            agent_name: st.agentName,
            applicant_name: applicantNameTrim,
            applicant_phone: applicantPhoneTrim,
            applicant_email: applicantEmailTrim,
            recommender_name: recommender,
            label_image_url: labelImageUrlFinal,
          })
          .eq("id", st.editingId);
        if (updateError != null) throw updateError;
        const updated: CartLine = {
          id: st.editingId,
          productNameEn: productNameEnTrim,
          category1: st.category1,
          category2: st.category2,
          category3: st.category3,
          feiNumber: feiTrim,
          ingredientText: ingredientTrim,
          labelImageUrl: labelImageUrlFinal,
          rpNameEn: st.rpNameEn.trim(),
          rpContact: st.rpContact.trim(),
          agentName: st.agentName,
          applicantName: applicantNameTrim,
          applicantPhone: applicantPhoneTrim,
          applicantEmail: applicantEmailTrim,
        };
        st.setCartLines((prev) =>
          prev.map((c) => (c.id === st.editingId ? updated : c)),
        );
        st.setEditingId(null);
        st.clearProductZoneB();
        router.push("/apply/step3");
      } catch (err) {
        console.error(err);
        alert(
          err instanceof Error
            ? err.message
            : "수정 반영 중 오류가 발생했습니다.",
        );
      } finally {
        st.setIsAddingProduct(false);
      }
      return;
    }

    st.setIsAddingProduct(true);
    try {
      const labelImageUrls = await uploadLabelFiles(files);
      const { data: inserted, error: insertError } = await supabase
        .from("products")
        .insert({
          rp_name_en: st.rpNameEn.trim(),
          rp_contact: st.rpContact.trim(),
          product_name_en: productNameEnTrim,
          fei_number: feiTrim,
          category1: st.category1,
          category2: st.category2,
          category3: st.category3,
          ingredient_text: ingredientTrim,
          agent_name: st.agentName,
          applicant_name: applicantNameTrim,
          applicant_phone: applicantPhoneTrim,
          applicant_email: applicantEmailTrim,
          recommender_name: recommender,
          label_image_url:
            labelImageUrls.length > 0 ? labelImageUrls.join(", ") : "",
        })
        .select("id")
        .single();
      if (insertError != null) throw insertError;
      if (inserted?.id == null || inserted.id === "") {
        throw new Error(
          "저장 후 제품 ID를 받지 못했습니다. RLS·정책을 확인해 주세요.",
        );
      }
      const joinedLabels =
        labelImageUrls.length > 0 ? labelImageUrls.join(", ") : "";
      const line: CartLine = {
        id: inserted.id,
        productNameEn: productNameEnTrim,
        category1: st.category1,
        category2: st.category2,
        category3: st.category3,
        feiNumber: feiTrim,
        ingredientText: ingredientTrim,
        labelImageUrl: joinedLabels,
        rpNameEn: st.rpNameEn.trim(),
        rpContact: st.rpContact.trim(),
        agentName: st.agentName,
        applicantName: applicantNameTrim,
        applicantPhone: applicantPhoneTrim,
        applicantEmail: applicantEmailTrim,
      };
      st.setCartLines((prev) => [...prev, line]);
      st.setCommonRequiredError({});
      st.clearProductZoneB();
      router.push("/apply/step3");
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "목록 반영 중 오류가 발생했습니다. 네트워크와 설정을 확인한 뒤 다시 시도해 주세요.",
      );
    } finally {
      st.setIsAddingProduct(false);
    }
  }, [router]);

  return (
    <ApplyShell>
      <AicraHeader page="register" />
      <div className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-lg shadow-emerald-950/5 ring-1 ring-amber-200/50">
          <ApplyCardHeader />
          <div className="p-6 sm:p-8">
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
                    className="shrink-0 rounded-xl border border-amber-400/40 bg-emerald-950 px-5 py-3 text-sm font-semibold text-stone-50 shadow-sm transition-colors hover:bg-emerald-900 disabled:opacity-60"
                  >
                    {s.aiSearchLoading ? "검색 중..." : "검색"}
                  </button>
                </div>
                {s.aiCategoryQueryError ? (
                  <p className="mt-1 text-sm text-red-500">
                    특수기호는 제한됩니다.
                  </p>
                ) : null}
                {s.aiRecommendation != null ? (
                  <div className="mt-3 rounded-lg border border-amber-100 bg-stone-50 px-3 py-2.5 text-sm text-zinc-800">
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
                      id="apply-ingredient-text"
                      value={s.ingredientText}
                      onChange={(e) => {
                        s.clearProductFieldKey("ingredientText");
                        s.clearProductFieldKey("ingredientConfirm");
                        s.setIngredientText(e.target.value);
                        s.setIsIngredientConfirmed(false);
                      }}
                      rows={5}
                      disabled={s.isAddingProduct}
                      className={`w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm outline-none disabled:bg-zinc-50 ${
                        s.productFieldError.ingredientText === true
                          ? invalidFieldClass
                          : normalFieldClass
                      }`}
                    />
                    <div
                      className={
                        s.productFieldError.ingredientConfirm === true
                          ? "mt-2 inline-block rounded-lg p-1 ring-2 ring-red-400"
                          : "mt-2"
                      }
                    >
                      <button
                        type="button"
                        disabled={s.isAddingProduct}
                        onClick={() => {
                          s.setIsIngredientConfirmed(true);
                          s.clearProductFieldKey("ingredientConfirm");
                        }}
                        className="w-full rounded-lg border border-zinc-300 bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-200 disabled:opacity-60 sm:w-auto sm:px-6"
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
                s.editingId != null
                  ? "수정 저장 후 다음 단계로"
                  : "저장하고 다음 단계로"
              }
              onNext={() => void runAddOrEdit()}
              nextDisabled={s.isAddingProduct}
            />
          </div>
        </div>
      </div>
      <AgreementModal />
    </ApplyShell>
  );
}
