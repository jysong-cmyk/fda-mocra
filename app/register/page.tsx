"use client";

import { AicraHeader, aicraGradientCtaClass } from "@/components/aicra-header";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../../lib/supabase";
import { fdaCategories } from "../fdaCategories";

/** 영문 RP명·제품명 — 하이픈은 클래스 끝에 두어 +-/ 범위 오해 방지 */
const RP_PRODUCT_NAME_REGEX = /^[a-zA-Z0-9\s.,&'()+\/\-]*$/;
/** 카테고리 빠른 검색 입력 패턴 */
const AI_CATEGORY_QUERY_REGEX =
  /^[a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ0-9\s/+%.,\-]*$/;

type AiRecommendation = {
  pathLabel: string;
  category1: string;
  category2: string;
  category3: string;
};

/** 개별 제품 폼 — 제출 실패 시 빨간 강조, 입력 시 즉시 해제 */
type ProductFieldKey =
  | "productNameEn"
  | "category"
  | "fei"
  | "labels"
  | "ingredientImage"
  | "ingredientText"
  | "ingredientConfirm";

/** 서버에 반영된 제품 행 id + 폼·수정·불러오기용 필드 */
type CartLine = {
  id: string;
  productNameEn: string;
  category1: string;
  category2: string;
  category3: string;
  feiNumber: string;
  ingredientText: string;
  /** 라벨 미재첨부 시 update에 그대로 사용 */
  labelImageUrl: string;
  /** 반영 시점 공통 정보 스냅샷 — [불러오기] 시 폼에 그대로 채움 */
  rpNameEn: string;
  rpContact: string;
  agentName: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
};

/** 목록 추가 시 공통 필수 검증 — 누락 시 빨간 테두리 */
type CommonRequiredKey =
  | "agreement"
  | "rpNameEn"
  | "rpContact"
  | "applicantName"
  | "applicantPhone"
  | "applicantEmail";

function pathLabelFrom(
  category1: string,
  category2: string,
  category3: string,
): string {
  return `${category1} > ${category2} > ${category3}`;
}

const FAKE_OCR_TEXT =
  "Water, Glycerin, Butylene Glycol, Niacinamide...";

const kb = "break-keep text-balance" as const;

function Ag({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-amber-600">{children}</span>;
}

const KO_EN_SCAN_LINES = [
  { ko: "글리세린", en: "Glycerin" },
  { ko: "정제수", en: "Water" },
  { ko: "병풀추출물", en: "Centella Asiatica Extract" },
] as const;

/** 우측 한글 → 영문 INCI 스캔 시각화 (clip-path + 스캔 바 동기화) */
function RegisterKoEnScanPreview() {
  return (
    <div
      className="relative h-[4.25rem] w-full max-w-[11rem] shrink-0 overflow-hidden rounded-md border border-amber-200/40 bg-stone-50/90 shadow-sm sm:h-[4.5rem] sm:max-w-[12rem]"
      aria-hidden
    >
      <div
        className={`absolute inset-0 z-0 flex flex-col justify-center gap-0.5 px-2.5 py-1 ${kb}`}
      >
        {KO_EN_SCAN_LINES.map(({ ko }) => (
          <span
            key={ko}
            className="text-[10px] leading-tight tracking-tight text-zinc-400 sm:text-[11px]"
          >
            {ko}
          </span>
        ))}
      </div>
      <div
        className={`register-ko-en-scan__en absolute inset-0 z-[1] flex flex-col justify-center gap-0.5 px-2.5 py-1 ${kb}`}
      >
        {KO_EN_SCAN_LINES.map(({ en }) => (
          <span
            key={en}
            className="text-[10px] font-semibold leading-tight tracking-tight text-emerald-950 sm:text-[11px]"
          >
            {en}
          </span>
        ))}
      </div>
      <div className="register-ko-en-scan__bar pointer-events-none absolute inset-x-2 z-[2] h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_10px_rgba(251,191,36,0.45)]" />
    </div>
  );
}

function RegisterAiTrustStrip() {
  return (
    <div
      className={`mb-4 flex flex-col items-stretch gap-3 rounded-lg border border-amber-200/40 bg-stone-50 px-3 py-2.5 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3 ${kb}`}
    >
      <p
        className={`min-w-0 flex-1 text-left text-lg font-bold leading-snug text-emerald-950 md:text-xl ${kb}`}
      >
        <span className="block">Aicra의 안내에 따라 정보를 입력하면,</span>
        <span className="mt-0.5 block sm:mt-1">
          쉽고 빠르게 MOCRA 등록이 가능합니다.
        </span>
      </p>
      <div className="flex shrink-0 justify-center sm:justify-end">
        <RegisterKoEnScanPreview />
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
  tooltip,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  tooltip?: string;
}) {
  const labelClass = "text-sm font-medium text-zinc-800";
  return (
    <div className="mb-1.5 flex items-center gap-2">
      {htmlFor != null ? (
        <label htmlFor={htmlFor} className={labelClass}>
          {children}
        </label>
      ) : (
        <span className={labelClass}>{children}</span>
      )}
      {tooltip != null ? (
        <span className="group relative inline-flex shrink-0">
          <span
            className="flex h-5 w-5 cursor-help items-center justify-center rounded-full bg-zinc-300 text-[10px] font-bold text-zinc-600"
            aria-hidden
          >
            ?
          </span>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-[min(280px,calc(100vw-3rem))] -translate-x-1/2 rounded-lg bg-black px-3 py-2 text-left text-xs font-normal leading-relaxed text-white shadow-lg group-hover:block"
          >
            {tooltip}
          </span>
        </span>
      ) : null}
    </div>
  );
}

export default function Home() {
  const [rpNameEn, setRpNameEn] = useState("");
  const [rpContact, setRpContact] = useState("");
  const [productNameEn, setProductNameEn] = useState("");
  const [category1, setCategory1] = useState("");
  const [category2, setCategory2] = useState("");
  const [category3, setCategory3] = useState("");
  const [feiNumber, setFeiNumber] = useState("");
  const [labelFiles, setLabelFiles] = useState<File[]>([]);
  const [ingredientFileMeta, setIngredientFileMeta] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ingredientText, setIngredientText] = useState("");
  const [showIngredientTextarea, setShowIngredientTextarea] = useState(false);
  const [isIngredientConfirmed, setIsIngredientConfirmed] = useState(false);
  const [agentName, setAgentName] = useState("");

  const [aiCategoryQuery, setAiCategoryQuery] = useState("");
  const [aiRecommendation, setAiRecommendation] = useState<AiRecommendation | null>(
    null,
  );
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [rpNameEnError, setRpNameEnError] = useState(false);
  const [productNameEnError, setProductNameEnError] = useState(false);
  const [rpContactError, setRpContactError] = useState(false);
  const [aiCategoryQueryError, setAiCategoryQueryError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [feiError, setFeiError] = useState("");
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productFieldError, setProductFieldError] = useState<
    Partial<Record<ProductFieldKey, boolean>>
  >({});
  const [commonRequiredError, setCommonRequiredError] = useState<
    Partial<Record<CommonRequiredKey, boolean>>
  >({});

  const router = useRouter();
  const ocrTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (ocrTimeoutRef.current != null) {
        clearTimeout(ocrTimeoutRef.current);
      }
    };
  }, []);

  const l1Node = useMemo(
    () => fdaCategories.find((n) => n.value === category1) ?? null,
    [category1],
  );

  const l2Options = l1Node?.children ?? [];
  const l2Node = useMemo(
    () => l2Options.find((n) => n.value === category2) ?? null,
    [l2Options, category2],
  );

  const l3Options = l2Node?.children ?? [];

  function clearProductFieldKey(key: ProductFieldKey) {
    setProductFieldError((prev) => {
      if (prev[key] !== true) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function clearCommonRequiredKey(key: CommonRequiredKey) {
    setCommonRequiredError((prev) => {
      if (prev[key] !== true) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleCategory1Change(value: string) {
    setCategory1(value);
    setCategory2("");
    setCategory3("");
    clearProductFieldKey("category");
  }

  function handleCategory2Change(value: string) {
    setCategory2(value);
    setCategory3("");
    clearProductFieldKey("category");
  }

  function applyAiRecommendation() {
    if (aiRecommendation == null) return;
    setCategory1(aiRecommendation.category1);
    setCategory2(aiRecommendation.category2);
    setCategory3(aiRecommendation.category3);
    setAiRecommendation(null);
    clearProductFieldKey("category");
  }

  function handleIngredientImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (ocrTimeoutRef.current != null) {
      clearTimeout(ocrTimeoutRef.current);
      ocrTimeoutRef.current = null;
    }

    if (!file) {
      setIngredientFileMeta(null);
      setOcrProcessing(false);
      setIsIngredientConfirmed(false);
      return;
    }

    setIsIngredientConfirmed(false);

    setIngredientFileMeta({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    clearProductFieldKey("ingredientImage");
    setOcrProcessing(true);

    ocrTimeoutRef.current = setTimeout(() => {
      ocrTimeoutRef.current = null;
      setOcrProcessing(false);
      setIngredientText(FAKE_OCR_TEXT);
      setShowIngredientTextarea(true);
      setIsIngredientConfirmed(false);
    }, 2000);
  }

  function handleLabelImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (list == null || list.length === 0) {
      e.target.value = "";
      return;
    }
    const newFiles = Array.from(list);
    setLabelFiles((prev) => {
      if (prev.length + newFiles.length > 4) {
        alert("영문 패키지 사진은 최대 4장까지만 업로드할 수 있습니다.");
        return prev;
      }
      const merged = [...prev, ...newFiles];
      if (merged.length > prev.length) {
        queueMicrotask(() => clearProductFieldKey("labels"));
      }
      return merged;
    });
    e.target.value = "";
  }

  function removeLabelFile(index: number) {
    setLabelFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0) {
        queueMicrotask(() => clearProductFieldKey("labels"));
      }
      return next;
    });
  }

  async function handleAiSearchClick() {
    if (aiCategoryQuery.trim() === "") {
      alert("검색할 제품 종류를 입력해 주세요.");
      return;
    }
    if (aiCategoryQueryError) {
      alert(
        "입력 형식에 오류가 있는 항목이 있습니다. 빨간색 안내 문구를 확인해주세요.",
      );
      return;
    }

    setAiSearchLoading(true);
    try {
      const res = await fetch("/api/recommend-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiCategoryQuery }),
      });

      const data = (await res.json()) as {
        category1?: string;
        category2?: string;
        category3?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? res.statusText);
      }

      const c1 = data.category1 ?? "";
      const c2 = data.category2 ?? "";
      const c3 = data.category3 ?? "";

      setAiRecommendation({
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
      setAiSearchLoading(false);
    }
  }

  function sanitizeStorageFileName(name: string): string {
    const trimmed = name.trim();
    const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
    return safe.length > 0 ? safe : "image";
  }

  function clearProductZoneB() {
    setProductNameEn("");
    setCategory1("");
    setCategory2("");
    setCategory3("");
    setFeiNumber("");
    setFeiError("");
    setLabelFiles([]);
    setIngredientFileMeta(null);
    setOcrProcessing(false);
    if (ocrTimeoutRef.current != null) {
      clearTimeout(ocrTimeoutRef.current);
      ocrTimeoutRef.current = null;
    }
    setIngredientText("");
    setShowIngredientTextarea(false);
    setIsIngredientConfirmed(false);
    setAiCategoryQuery("");
    setAiRecommendation(null);
    setAiCategoryQueryError(false);
    setProductNameEnError(false);
    setEditingId(null);
    setProductFieldError({});
  }

  function fillProductFormFromLine(line: CartLine) {
    setProductNameEn(line.productNameEn);
    setCategory1(line.category1);
    setCategory2(line.category2);
    setCategory3(line.category3);
    setFeiNumber(line.feiNumber);
    setFeiError("");
    setIngredientText(line.ingredientText);
    setShowIngredientTextarea(true);
    setIsIngredientConfirmed(true);
    setIngredientFileMeta(null);
    setLabelFiles([]);
    setProductNameEnError(
      line.productNameEn.length > 0 &&
        !RP_PRODUCT_NAME_REGEX.test(line.productNameEn),
    );
    setAiCategoryQuery("");
    setAiRecommendation(null);
    setAiCategoryQueryError(false);
    setProductFieldError({});
  }

  function isProductDraftDirty(): boolean {
    if (productNameEn.trim() !== "") return true;
    if (category1 !== "" || category2 !== "" || category3 !== "") return true;
    if (feiNumber.trim() !== "") return true;
    if (labelFiles.length > 0) return true;
    if (ingredientFileMeta !== null) return true;
    if (ingredientText.trim() !== "") return true;
    if (aiCategoryQuery.trim() !== "") return true;
    if (aiRecommendation !== null) return true;
    if (ocrProcessing) return true;
    return false;
  }

  async function uploadLabelFiles(files: File[]): Promise<string[]> {
    const labelImageUrls: string[] = [];
    const batchId =
      globalThis.crypto?.randomUUID?.() ??
      `b-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const unique = `${Date.now()}-${i}-${batchId}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 11)}`;
      const objectPath = `${unique}-${sanitizeStorageFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from("labels")
        .upload(objectPath, file, { cacheControl: "3600", upsert: false });

      if (uploadError != null) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("labels")
        .getPublicUrl(objectPath);

      labelImageUrls.push(urlData.publicUrl);
    }
    return labelImageUrls;
  }

  async function handleAddProductToDb() {
    const commonErr: Partial<Record<CommonRequiredKey, boolean>> = {};
    if (!isAgreed) {
      commonErr.agreement = true;
    } else {
      if (rpNameEn.trim() === "") {
        commonErr.rpNameEn = true;
      }
      if (rpContact.trim() === "") {
        commonErr.rpContact = true;
      }
      if (applicantName.trim() === "") {
        commonErr.applicantName = true;
      }
      if (applicantPhone.trim() === "") {
        commonErr.applicantPhone = true;
      }
      if (applicantEmail.trim() === "") {
        commonErr.applicantEmail = true;
      }
    }

    const nextErr: Partial<Record<ProductFieldKey, boolean>> = {};
    if (productNameEn.trim() === "" || productNameEnError) {
      nextErr.productNameEn = true;
    }
    if (category1 === "" || category2 === "" || category3 === "") {
      nextErr.category = true;
    }
    if (feiNumber.trim() === "") {
      nextErr.fei = true;
    }
    if (labelFiles.length === 0) {
      nextErr.labels = true;
    }
    if (ingredientFileMeta === null) {
      nextErr.ingredientImage = true;
    }
    if (ingredientText.trim() === "") {
      nextErr.ingredientText = true;
    }
    if (!isIngredientConfirmed) {
      nextErr.ingredientConfirm = true;
    }

    const hasCommonMissing = Object.keys(commonErr).length > 0;
    const hasProductMissing = Object.keys(nextErr).length > 0;

    if (hasCommonMissing || hasProductMissing) {
      setCommonRequiredError(commonErr);
      setProductFieldError(nextErr);
      alert(
        hasCommonMissing && hasProductMissing
          ? "[공통 정보]와 [개별 제품 정보]에서 빨간 테두리 항목을 모두 확인해 주세요. 동의·RP·신청자 정보와 제품·라벨·성분표가 필요합니다."
          : hasCommonMissing
            ? "[공통 정보] 빨간 테두리 항목을 확인해 주세요. 동의서·영문 RP·연락처·신청자 정보를 완료해 주세요."
            : "[개별 제품 정보] 빨간 테두리 항목을 확인해 주세요. 영문명·카테고리·FEI·라벨·성분표를 모두 입력해야 합니다.",
      );
      return;
    }

    if (rpNameEnError || rpContactError) {
      alert(
        "입력 형식에 오류가 있는 항목이 있습니다. 빨간색 안내 문구를 확인해주세요.",
      );
      return;
    }

    if (nameError !== "" || phoneError !== "" || emailError !== "") {
      alert(
        "신청자 정보 입력 형식에 오류가 있습니다. 동의서 화면의 빨간 안내를 확인해 주세요.",
      );
      return;
    }

    if (aiCategoryQueryError) {
      alert(
        "입력 형식에 오류가 있는 항목이 있습니다. 빨간색 안내 문구를 확인해주세요.",
      );
      return;
    }

    const applicantNameTrim = applicantName.trim();
    const applicantPhoneTrim = applicantPhone.trim();
    const applicantEmailTrim = applicantEmail.trim();
    const recommender = agentName.replace(/\s+/g, "");
    const productNameEnTrim = productNameEn.trim();
    const feiTrim = feiNumber.trim();
    const ingredientTrim = ingredientText.trim();
    const files = [...labelFiles];

    setIsAddingProduct(true);
    try {
      const labelImageUrls = await uploadLabelFiles(files);

      const { data: inserted, error: insertError } = await supabase
        .from("products")
        .insert({
          rp_name_en: rpNameEn.trim(),
          rp_contact: rpContact.trim(),
          product_name_en: productNameEnTrim,
          fei_number: feiTrim,
          category1,
          category2,
          category3,
          ingredient_text: ingredientTrim,
          agent_name: agentName,
          applicant_name: applicantNameTrim,
          applicant_phone: applicantPhoneTrim,
          applicant_email: applicantEmailTrim,
          recommender_name: recommender,
          label_image_url:
            labelImageUrls.length > 0 ? labelImageUrls.join(", ") : "",
        })
        .select("id")
        .single();

      if (insertError != null) {
        throw insertError;
      }
      if (inserted?.id == null || inserted.id === "") {
        throw new Error("저장 후 제품 ID를 받지 못했습니다. RLS·정책을 확인해 주세요.");
      }

      const joinedLabels =
        labelImageUrls.length > 0 ? labelImageUrls.join(", ") : "";

      const line: CartLine = {
        id: inserted.id,
        productNameEn: productNameEnTrim,
        category1,
        category2,
        category3,
        feiNumber: feiTrim,
        ingredientText: ingredientTrim,
        labelImageUrl: joinedLabels,
        rpNameEn: rpNameEn.trim(),
        rpContact: rpContact.trim(),
        agentName,
        applicantName: applicantNameTrim,
        applicantPhone: applicantPhoneTrim,
        applicantEmail: applicantEmailTrim,
      };
      setCartLines((prev) => [...prev, line]);
      setCommonRequiredError({});
      clearProductZoneB();
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "목록 반영 중 오류가 발생했습니다. 네트워크와 설정을 확인한 뒤 다시 시도해 주세요.",
      );
    } finally {
      setIsAddingProduct(false);
    }
  }

  function handleCopyCartLineToForm(line: CartLine) {
    setEditingId(null);
    const rpN = line.rpNameEn ?? "";
    const rpC = line.rpContact ?? "";
    setRpNameEn(rpN);
    setRpContact(rpC);
    setRpNameEnError(rpN.length > 0 && !RP_PRODUCT_NAME_REGEX.test(rpN));
    setRpContactError(
      rpC.length > 0 && rpC.replace(/[^0-9-+]/g, "") !== rpC,
    );
    setAgentName(line.agentName ?? "");
    setApplicantName(line.applicantName ?? "");
    setApplicantPhone(line.applicantPhone ?? "");
    setApplicantEmail(line.applicantEmail ?? "");
    setNameError("");
    setPhoneError("");
    setEmailError("");
    setIsAgreed(true);
    setCommonRequiredError({});
    fillProductFormFromLine(line);
  }

  function handleEditCartLine(line: CartLine) {
    fillProductFormFromLine(line);
    setEditingId(line.id);
    requestAnimationFrame(() => {
      productSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function handleCompleteEditProduct() {
    if (editingId == null) return;
    if (!isAgreed) {
      alert("서비스 대행 동의서 확인 및 신청자 정보를 먼저 완료해 주세요.");
      return;
    }
    if (rpNameEn.trim() === "" || rpContact.trim() === "") {
      alert("[공통 정보] 영문 RP명과 RP 연락처를 입력해 주세요.");
      return;
    }
    if (rpNameEnError || rpContactError) {
      alert(
        "입력 형식에 오류가 있는 항목이 있습니다. 빨간색 안내 문구를 확인해주세요.",
      );
      return;
    }

    const line = cartLines.find((c) => c.id === editingId);
    if (line == null) {
      alert("수정 대상 제품을 찾을 수 없습니다.");
      setEditingId(null);
      clearProductZoneB();
      return;
    }

    const productNameEnTrim = productNameEn.trim();
    const feiTrim = feiNumber.trim();
    const ingredientTrim = ingredientText.trim();

    const hasNewLabels = labelFiles.length > 0;
    const hasExistingLabels = line.labelImageUrl.trim() !== "";
    if (!hasNewLabels && !hasExistingLabels) {
      setProductFieldError((p) => ({ ...p, labels: true }));
      alert("라벨 이미지는 필수입니다.");
      return;
    }

    const nextErr: Partial<Record<ProductFieldKey, boolean>> = {};
    if (productNameEnTrim === "" || productNameEnError) {
      nextErr.productNameEn = true;
    }
    if (category1 === "" || category2 === "" || category3 === "") {
      nextErr.category = true;
    }
    if (feiTrim === "") {
      nextErr.fei = true;
    }
    if (ingredientTrim === "") {
      nextErr.ingredientText = true;
    }
    if (!isIngredientConfirmed) {
      nextErr.ingredientConfirm = true;
    }

    if (Object.keys(nextErr).length > 0) {
      setProductFieldError(nextErr);
      alert(
        "[개별 제품 정보] 빨간 테두리 항목을 확인해 주세요.",
      );
      return;
    }

    if (aiCategoryQueryError) {
      alert(
        "입력 형식에 오류가 있는 항목이 있습니다. 빨간색 안내 문구를 확인해주세요.",
      );
      return;
    }

    const applicantNameTrim = applicantName.trim();
    const applicantPhoneTrim = applicantPhone.trim();
    const applicantEmailTrim = applicantEmail.trim();
    const recommender = agentName.replace(/\s+/g, "");

    setIsAddingProduct(true);
    try {
      let labelImageUrlFinal = line.labelImageUrl;
      if (hasNewLabels) {
        const urls = await uploadLabelFiles([...labelFiles]);
        labelImageUrlFinal = urls.length > 0 ? urls.join(", ") : "";
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          rp_name_en: rpNameEn.trim(),
          rp_contact: rpContact.trim(),
          product_name_en: productNameEnTrim,
          fei_number: feiTrim,
          category1,
          category2,
          category3,
          ingredient_text: ingredientTrim,
          agent_name: agentName,
          applicant_name: applicantNameTrim,
          applicant_phone: applicantPhoneTrim,
          applicant_email: applicantEmailTrim,
          recommender_name: recommender,
          label_image_url: labelImageUrlFinal,
        })
        .eq("id", editingId);

      if (updateError != null) {
        throw updateError;
      }

      const updated: CartLine = {
        id: editingId,
        productNameEn: productNameEnTrim,
        category1,
        category2,
        category3,
        feiNumber: feiTrim,
        ingredientText: ingredientTrim,
        labelImageUrl: labelImageUrlFinal,
        rpNameEn: rpNameEn.trim(),
        rpContact: rpContact.trim(),
        agentName,
        applicantName: applicantNameTrim,
        applicantPhone: applicantPhoneTrim,
        applicantEmail: applicantEmailTrim,
      };
      setCartLines((prev) =>
        prev.map((c) => (c.id === editingId ? updated : c)),
      );
      setEditingId(null);
      clearProductZoneB();
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "수정 반영 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsAddingProduct(false);
    }
  }

  async function handleDeleteCartLine(id: string) {
    if (
      !window.confirm(
        "접수 목록에서 이 제품을 삭제할까요? 삭제 후에는 복구할 수 없습니다.",
      )
    ) {
      return;
    }
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error != null) {
      alert(
        error.message ||
          "삭제에 실패했습니다. 권한(RLS) 또는 네트워크를 확인해 주세요.",
      );
      return;
    }
    setCartLines((prev) => prev.filter((x) => x.id !== id));
    if (editingId === id) {
      setEditingId(null);
      clearProductZoneB();
    }
  }

  function handleOpenBulkConfirm() {
    if (cartLines.length === 0) {
      alert(
        "[목록에 추가하기]로 제출 대기 목록에 최소 1건 이상 담아 주세요.",
      );
      return;
    }
    if (!isAgreed) {
      alert("서비스 대행 동의서 확인 및 신청자 정보를 입력해 주세요.");
      return;
    }
    if (rpNameEn.trim() === "" || rpContact.trim() === "") {
      alert("[공통 정보] 영문 RP명과 RP 연락처를 입력해 주세요.");
      return;
    }
    if (rpNameEnError || rpContactError) {
      alert(
        "입력 형식에 오류가 있는 항목이 있습니다. 빨간색 안내 문구를 확인해주세요.",
      );
      return;
    }
    if (
      applicantName.trim() === "" ||
      applicantPhone.trim() === "" ||
      applicantEmail.trim() === ""
    ) {
      alert("신청자 정보(기업명·연락처·이메일)를 동의서 화면에서 완료해 주세요.");
      return;
    }
    if (nameError !== "" || phoneError !== "" || emailError !== "") {
      alert(
        "신청자 정보 입력 형식에 오류가 있습니다. 동의서 화면을 확인해 주세요.",
      );
      return;
    }

    const n = cartLines.length;
    const hasUnsavedDraft =
      editingId !== null || isProductDraftDirty();
    if (hasUnsavedDraft) {
      const ok = window.confirm(
        [
          "입력창에 아직 [목록에 추가하기]로 담지 않은 내용이 남아 있거나, 수정을 마치지 않은 상태일 수 있습니다.",
          "",
          `현재 목록에는 이미 ${n}건이 반영되어 있습니다. 지금 최종 제출을 진행하면 입력창에만 있는 내용은 이번 접수에 포함되지 않으며, 목록에 담긴 ${n}건만 결제·접수 대상이 됩니다.`,
          "",
          `목록의 ${n}건만 먼저 접수하시겠습니까?`,
          "",
          "(입력창에 적은 제품도 함께 넣으려면 [취소]를 누른 뒤 [목록에 추가하기] 또는 [수정 완료]로 목록에 반영한 다음, 다시 최종 제출해 주세요.)",
        ].join("\n"),
      );
      if (!ok) {
        return;
      }
      clearProductZoneB();
    }

    setIsConfirmModalOpen(true);
  }

  function resetAllAfterSuccess() {
    if (ocrTimeoutRef.current != null) {
      clearTimeout(ocrTimeoutRef.current);
      ocrTimeoutRef.current = null;
    }
    setRpNameEn("");
    setRpContact("");
    clearProductZoneB();
    setAgentName("");
    setRpNameEnError(false);
    setRpContactError(false);
    setIsConfirmModalOpen(false);
    setIsAgreed(false);
    setApplicantName("");
    setApplicantPhone("");
    setApplicantEmail("");
    setNameError("");
    setPhoneError("");
    setEmailError("");
    setIsAgreementModalOpen(false);
    setCartLines([]);
    setEditingId(null);
    setProductFieldError({});
    setCommonRequiredError({});
  }

  function handleAgreementSave() {
    const name = applicantName.trim();
    const phone = applicantPhone.trim();
    const email = applicantEmail.trim();
    if (!name || !phone || !email) {
      alert("이름, 연락처, 이메일을 모두 입력해 주세요.");
      return;
    }
    setApplicantName(name);
    setApplicantPhone(phone);
    setApplicantEmail(email);
    setIsAgreed(true);
    setIsAgreementModalOpen(false);
    setCommonRequiredError((prev) => {
      const next = { ...prev };
      delete next.agreement;
      delete next.applicantName;
      delete next.applicantPhone;
      delete next.applicantEmail;
      return next;
    });
  }

  function handleFinalSubmit() {
    setIsSubmitting(true);
    try {
      resetAllAfterSuccess();
      router.push("/complete");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isEditingProduct = editingId != null;
  const applicantSummaryError =
    commonRequiredError.applicantName === true ||
    commonRequiredError.applicantPhone === true ||
    commonRequiredError.applicantEmail === true;

  const invalidFieldClass =
    "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200";
  const normalFieldClass =
    "border-zinc-200 ring-zinc-400 focus:border-zinc-300 focus:ring-2";

  return (
    <>
    <div className={`flex min-h-full flex-1 flex-col bg-stone-50 ${kb}`}>
      <AicraHeader page="register" />
      <div className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-lg shadow-emerald-950/5 ring-1 ring-amber-200/50">
          <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 px-6 py-6 sm:px-8 sm:py-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/90">
              Aicra
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-snug text-stone-50 break-keep text-balance sm:text-3xl">
              화장품 미국 MoCRA 등록
            </h1>
          </div>
          <div className="p-6 sm:p-8">
        <RegisterAiTrustStrip />
        <p className="text-red-500 font-semibold mb-1">
          OTC(썬크림, 기능성 화장품), 의료기기는 등록이 불가합니다.
        </p>
        <p className="text-gray-600 mb-2">
          MoCRA 등록에 필요한 정보를 입력해 주세요.
        </p>

        <form
          className="mt-8 space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <section className="space-y-5 rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
            <div
              className={`rounded-lg border border-emerald-950/10 bg-stone-100/50 px-4 py-3.5 sm:px-5 sm:py-4 ${kb}`}
            >
              <h2 className="text-base font-bold text-emerald-900 sm:text-lg">
                공통 정보 자동 유지
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-emerald-900/90">
                RP 및 신청자 정보는 한 번만 입력하면 모든 제품에 자동으로
                적용됩니다. 목록에 제품을 추가한 뒤에도 이 정보는 그대로
                유지되어 여러 제품을 편리하게 연속 등록하실 수 있습니다.
              </p>
            </div>

          <div
            className={`rounded-lg border border-gray-200 bg-white/80 p-4 ${
              commonRequiredError.agreement === true
                ? "ring-2 ring-red-400 ring-offset-2"
                : ""
            }`}
          >
            <p
              className={`mb-3 text-sm leading-relaxed text-emerald-900/90 ${kb}`}
            >
              안전하고 정확한 등록 진행을 위해 서비스 대행 동의 및 신청자 정보를
              입력해 주세요.
            </p>
            {!isAgreed ? (
              <button
                type="button"
                onClick={() => {
                  clearCommonRequiredKey("agreement");
                  setIsAgreementModalOpen(true);
                }}
                className="rounded-lg bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-stone-50 transition-colors hover:bg-emerald-900"
              >
                서비스 대행 동의서 보기 및 정보 입력(필수)
              </button>
            ) : (
              <div
                className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
                  applicantSummaryError
                    ? "rounded-lg ring-2 ring-red-400 ring-offset-1"
                    : ""
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    ✅ 서비스 동의 및 신청자 정보 입력 완료
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {applicantName} · {applicantPhone} · {applicantEmail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAgreementModalOpen(true)}
                  className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                >
                  수정하기
                </button>
              </div>
            )}
          </div>

          <div>
            <FieldLabel
              htmlFor="rp-name-en"
              tooltip="미국 수출용 제품의 영문 라벨에 기재된 판매 책임 회사(RP)의 정확한 영문 명칭을 입력해 주세요."
            >
              영문 라벨 상 판매 기업명 (Responsible Person)
            </FieldLabel>
            <input
              id="rp-name-en"
              name="rpNameEn"
              type="text"
              autoComplete="name"
              value={rpNameEn}
              onChange={(e) => {
                const raw = e.target.value;
                const sanitized = raw.replace(/[^a-zA-Z0-9\s.,&()-]/g, "");
                if (raw !== sanitized) {
                  setRpNameEnError(true);
                } else {
                  setRpNameEnError(false);
                }
                setRpNameEn(sanitized);
                clearCommonRequiredKey("rpNameEn");
              }}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-shadow placeholder:text-zinc-400 ${
                rpNameEnError || commonRequiredError.rpNameEn === true
                  ? invalidFieldClass
                  : normalFieldClass
              }`}
              placeholder="예: Beauty Cosmetics Inc."
            />
            {rpNameEnError ? (
              <p className="text-red-500 text-sm mt-1">
                영문, 숫자 및 일부 특수문자(.,&()-)만 입력 가능합니다.
              </p>
            ) : null}
          </div>

          <div>
            <FieldLabel
              htmlFor="rp-contact"
              tooltip="영문 라벨 상 판매 기업(RP)의 연락처를 입력해 주세요."
            >
              영문 라벨 상 판매 기업 연락처 (Responsible Person 연락처)
            </FieldLabel>
            <input
              id="rp-contact"
              name="rpContact"
              type="text"
              autoComplete="tel"
              value={rpContact}
              onChange={(e) => {
                const raw = e.target.value;
                const sanitized = raw.replace(/[^0-9-+]/g, "");
                if (raw !== sanitized) {
                  setRpContactError(true);
                } else {
                  setRpContactError(false);
                }
                setRpContact(sanitized);
                clearCommonRequiredKey("rpContact");
              }}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-shadow placeholder:text-zinc-400 ${
                rpContactError || commonRequiredError.rpContact === true
                  ? invalidFieldClass
                  : normalFieldClass
              }`}
              placeholder="예: +82-2-1234-5678"
            />
            {rpContactError ? (
              <p className="text-red-500 text-sm mt-1">
                숫자, 하이픈(-), 플러스(+) 기호만 입력 가능합니다.
              </p>
            ) : null}
          </div>

          <div>
            <FieldLabel
              htmlFor="agent-name"
              tooltip="이 웹사이트(서비스)를 소개해준 당사 영업 담당자의 이름을 한글로 입력해 주세요. (※ 고객님 회사의 내부 직원이 아닙니다.)"
            >
              추천인(영업 담당자) 이름 (선택 사항)
            </FieldLabel>
            <input
              id="agent-name"
              name="agentName"
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-400 transition-shadow placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2"
              placeholder="예: 홍길동 (한글 입력)"
            />
            <p className="mt-2 text-sm font-semibold text-emerald-800">
              추천인 이름을 입력하시면 할인 혜택이 적용됩니다.
            </p>
          </div>
          </section>

          <section
            ref={productSectionRef}
            className={`space-y-5 rounded-xl border p-5 scroll-mt-6 shadow-sm transition-colors ${
              isEditingProduct
                ? "border-amber-300/90 bg-amber-50/30 ring-1 ring-amber-200/60"
                : "border-amber-100 bg-white"
            }`}
          >
            <div
              className={`rounded-lg border border-emerald-950/10 bg-stone-100/50 px-4 py-3.5 sm:px-5 sm:py-4 ${kb}`}
            >
              <h2 className="text-base font-bold text-emerald-900 sm:text-lg">
                효율적인 연속 등록 프로세스
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-emerald-900/90">
                제품 상세 정보(영문명, 카테고리, 성분 등)를 입력하고{" "}
                <span className="font-semibold">목록에 추가하기</span>를
                클릭하세요. 공통 정보는 고정된 채 다음 제품 정보만 즉시 이어서
                작성하실 수 있습니다.
              </p>
            </div>

          {isEditingProduct ? (
            <p className="rounded-lg border border-amber-400 bg-amber-100/90 px-3 py-2 text-sm font-medium text-amber-950">
              현재 특정 제품을 수정 중입니다. 반영하려면{" "}
              <span className="font-semibold">수정 완료</span>, 나가려면{" "}
              <span className="font-semibold">수정 취소</span>를 눌러 주세요.
            </p>
          ) : null}

          <div>
            <FieldLabel
              htmlFor="product-name-en"
              tooltip="패키지나 라벨에 표기된 영문 제품명과 정확히 동일해야 합니다."
            >
              영문 제품명
            </FieldLabel>
            <input
              id="product-name-en"
              name="productNameEn"
              type="text"
              value={productNameEn}
              onChange={(e) => {
                const v = e.target.value;
                clearProductFieldKey("productNameEn");
                setProductNameEn(v);
                setProductNameEnError(
                  v.length > 0 && !RP_PRODUCT_NAME_REGEX.test(v),
                );
              }}
              disabled={isAddingProduct}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-shadow placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 ${
                productFieldError.productNameEn === true || productNameEnError
                  ? invalidFieldClass
                  : normalFieldClass
              }`}
              placeholder="라벨과 동일한 영문명"
            />
            {productNameEnError ? (
              <p className="text-red-500 text-sm mt-1">
                영문/숫자 및 특정 특수기호만 입력 가능합니다.
              </p>
            ) : null}
          </div>

          <div>
            <FieldLabel
              htmlFor="ai-category-quick"
              tooltip="제품 종류(예: 토너, 수분크림, 샴푸)를 한글로 입력하면 Aicra가 적절한 FDA 카테고리를 추천합니다."
            >
              <span className="text-base font-semibold text-zinc-900">
                제품 카테고리 (<Ag>Aicra</Ag> 빠른 카테고리 찾기)
              </span>
            </FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                id="ai-category-quick"
                name="aiCategoryQuery"
                type="text"
                value={aiCategoryQuery}
                onChange={(e) => {
                  const v = e.target.value;
                  setAiCategoryQuery(v);
                  setAiCategoryQueryError(
                    v.length > 0 && !AI_CATEGORY_QUERY_REGEX.test(v),
                  );
                }}
                disabled={isAddingProduct}
                className={`min-w-0 flex-1 rounded-xl border-2 bg-stone-50/80 px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-zinc-500 focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-amber-400/25 disabled:cursor-not-allowed disabled:opacity-60 ${
                  aiCategoryQueryError
                    ? "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200"
                    : "border-emerald-800/40 ring-emerald-900/15"
                }`}
                placeholder="예: 토너, 수분크림, 샴푸, 바디워시…"
              />
              <button
                type="button"
                onClick={() => void handleAiSearchClick()}
                disabled={
                  aiSearchLoading || isAddingProduct
                }
                className="shrink-0 rounded-xl border border-amber-400/40 bg-emerald-950 px-5 py-3 text-sm font-semibold text-stone-50 shadow-sm transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiSearchLoading ? "검색 중..." : "검색"}
              </button>
            </div>
            {aiCategoryQueryError ? (
              <p className="text-red-500 text-sm mt-1">
                특수기호는 제한됩니다.
              </p>
            ) : null}
            {aiRecommendation != null ? (
              <div className="mt-3 rounded-lg border border-amber-100 bg-stone-50 px-3 py-2.5 text-sm text-zinc-800">
                <p>
                  <span className="font-semibold text-emerald-900">추천 결과:</span>{" "}
                  {aiRecommendation.pathLabel}
                </p>
                <button
                  type="button"
                  disabled={isAddingProduct}
                  onClick={applyAiRecommendation}
                  className="mt-2 w-full rounded-lg bg-emerald-950 py-2 text-sm font-semibold text-stone-50 transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4"
                >
                  선택
                </button>
              </div>
            ) : null}

            <div
              className={`mt-6 grid grid-cols-1 gap-3 rounded-lg sm:grid-cols-3 sm:gap-3 ${
                productFieldError.category === true
                  ? "p-2 ring-2 ring-red-400 ring-offset-2"
                  : ""
              }`}
            >
              <div>
                <label
                  htmlFor="category-1"
                  className="mb-1 block text-xs font-medium text-zinc-500"
                >
                  1단계 (대분류)
                </label>
                <select
                  id="category-1"
                  name="category1"
                  value={category1}
                  onChange={(e) => handleCategory1Change(e.target.value)}
                  disabled={isAddingProduct}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-400 focus:border-zinc-300 focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500"
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
                  htmlFor="category-2"
                  className="mb-1 block text-xs font-medium text-zinc-500"
                >
                  2단계 (중분류)
                </label>
                <select
                  id="category-2"
                  name="category2"
                  value={category2}
                  onChange={(e) => handleCategory2Change(e.target.value)}
                  disabled={
                    category1 === "" || isAddingProduct
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-400 focus:border-zinc-300 focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
                >
                  <option value="">
                    {category1 === "" ? "1단계를 먼저 선택" : "선택"}
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
                  htmlFor="category-3"
                  className="mb-1 block text-xs font-medium text-zinc-500"
                >
                  3단계 (소분류)
                </label>
                <select
                  id="category-3"
                  name="category3"
                  value={category3}
                  onChange={(e) => {
                    clearProductFieldKey("category");
                    setCategory3(e.target.value);
                  }}
                  disabled={
                    category2 === "" || isAddingProduct
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-400 focus:border-zinc-300 focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
                >
                  <option value="">
                    {category2 === "" ? "2단계를 먼저 선택" : "선택"}
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
              htmlFor="fei-number"
              className="mb-1.5 block text-sm font-medium text-zinc-800"
            >
              제조사 FEI 번호
            </label>
            <input
              id="fei-number"
              name="feiNumber"
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={feiNumber}
              onChange={(e) => {
                const raw = e.target.value;
                const digitsOnly = raw.replace(/[^0-9]/g, "");
                const sanitized = digitsOnly.slice(0, 10);
                if (raw !== digitsOnly) {
                  setFeiError("FEI 번호는 숫자만 입력 가능합니다.");
                } else if (raw.length > 10) {
                  setFeiError("FEI 번호는 10자리까지만 입력 가능합니다.");
                } else {
                  setFeiError("");
                  if (sanitized.length > 0) {
                    clearProductFieldKey("fei");
                  }
                }
                setFeiNumber(sanitized);
              }}
              disabled={isAddingProduct}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-shadow placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 ${
                productFieldError.fei === true || feiError !== ""
                  ? invalidFieldClass
                  : normalFieldClass
              }`}
              placeholder="숫자 10자리 입력"
            />
            {feiError ? (
              <p className="text-red-500 text-xs mt-1">{feiError}</p>
            ) : null}
          </div>

          <div
            className={`rounded-lg ${
              productFieldError.labels === true
                ? "p-2 ring-2 ring-red-400 ring-offset-1"
                : ""
            }`}
          >
            <FieldLabel
              htmlFor={
                labelFiles.length < 4 ? "label-images" : undefined
              }
              tooltip="제품의 앞/뒷면 라벨 및 패키지 사진을 모두 업로드해 주세요."
            >
              영문 패키지 or 라벨 사진
            </FieldLabel>
            {labelFiles.length < 4 ? (
              <input
                id="label-images"
                name="labelImages"
                type="file"
                multiple={true}
                accept="image/*"
                disabled={isAddingProduct}
                onChange={handleLabelImagesChange}
                className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              />
            ) : (
              <p className="text-sm text-zinc-500">
                최대 4장까지 첨부할 수 있습니다. 파일을 바꾸려면 목록에서 삭제해 주세요.
              </p>
            )}
            {labelFiles.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {labelFiles.map((f, index) => (
                  <li
                    key={`${f.name}-${index}-${f.size}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-800"
                  >
                    <span className="min-w-0 truncate" title={f.name}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      disabled={isAddingProduct}
                      onClick={() => removeLabelFile(index)}
                      className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`${f.name} 삭제`}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div
            className={`rounded-lg ${
              productFieldError.ingredientImage === true
                ? "p-2 ring-2 ring-red-400 ring-offset-1"
                : ""
            }`}
          >
            <FieldLabel
              htmlFor="ingredient-image"
              tooltip="성분표 이미지를 업로드하면 Aicra의 데이터 매핑 인텔리전스가 성분 정보를 분석합니다. 결과는 반드시 확인·수정해 주세요."
            >
              성분표 이미지 (Aicra 인텔리전스)
            </FieldLabel>
            <input
              id="ingredient-image"
              name="ingredientImage"
              type="file"
              accept="image/*"
              disabled={isAddingProduct}
              onChange={handleIngredientImageChange}
              className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {ocrProcessing ? (
              <div
                className="mt-3 flex items-center gap-2 text-sm text-zinc-600"
                role="status"
                aria-live="polite"
              >
                <span
                  className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-700"
                  aria-hidden
                />
                <span className={`font-bold text-emerald-950 ${kb}`}>
                  Aicra 데이터 매핑 인텔리전스가 성분 정보를 분석하는 중...
                </span>
              </div>
            ) : null}
            {showIngredientTextarea ? (
              <div className="mt-3">
                <label
                  htmlFor="ingredient-text"
                  className="mb-1.5 block text-xs font-medium text-zinc-500"
                >
                  인텔리전스 분석 결과 · 직접 수정 가능
                </label>
                <textarea
                  id="ingredient-text"
                  name="ingredientText"
                  value={ingredientText}
                  onChange={(e) => {
                    clearProductFieldKey("ingredientText");
                    clearProductFieldKey("ingredientConfirm");
                    setIngredientText(e.target.value);
                    setIsIngredientConfirmed(false);
                  }}
                  rows={5}
                  disabled={isAddingProduct}
                  className={`w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 ${
                    productFieldError.ingredientText === true
                      ? invalidFieldClass
                      : normalFieldClass
                  }`}
                  placeholder="변환된 성분 목록을 확인하고 수정하세요."
                />
                <div
                  className={`mt-2 inline-block w-full sm:w-auto ${
                    productFieldError.ingredientConfirm === true
                      ? "rounded-lg p-1 ring-2 ring-red-400"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    disabled={isAddingProduct}
                    onClick={() => {
                      setIsIngredientConfirmed(true);
                      clearProductFieldKey("ingredientConfirm");
                    }}
                    className="w-full rounded-lg border border-zinc-300 bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
                  >
                    성분표 확인
                  </button>
                </div>
                {isIngredientConfirmed ? (
                  <p className="mt-1.5 text-xs font-medium text-emerald-700">
                    성분표 내용 확인이 완료되었습니다.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <button
              type="button"
              disabled={isAddingProduct}
              onClick={() =>
                editingId != null
                  ? void handleCompleteEditProduct()
                  : void handleAddProductToDb()
              }
              className={`w-full flex-1 py-3 text-sm shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${aicraGradientCtaClass}`}
            >
              {isAddingProduct
                ? "목록에 반영 중…"
                : editingId != null
                  ? "수정 완료"
                  : "목록에 추가하기"}
            </button>
            {editingId != null ? (
              <button
                type="button"
                disabled={isAddingProduct}
                onClick={() => clearProductZoneB()}
                className="w-full flex-1 rounded-xl border-2 border-zinc-300 bg-white py-3 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-[11rem]"
              >
                수정 취소
              </button>
            ) : null}
          </div>
          </section>

          {cartLines.length > 0 ? (
            <section className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-emerald-900">
                제출 대기 목록 (총 {cartLines.length}건)
              </h3>
              <p
                className={`mt-1 text-xs leading-relaxed text-emerald-900/85 ${kb}`}
              >
                목록에 담아 둔 제품입니다. 삭제하면 이번 접수에서 제외되며
                되돌릴 수 없습니다.
              </p>
              <ul className="mt-3 space-y-2">
                {cartLines.map((line) => (
                  <li
                    key={line.id}
                    className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-900">
                        <span className="break-words">{line.productNameEn}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                        {pathLabelFrom(
                          line.category1,
                          line.category2,
                          line.category3,
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCartLineToForm(line)}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
                      >
                        불러오기
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditCartLine(line)}
                        className="rounded-lg border border-amber-200/60 bg-emerald-950/5 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-950/10"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCartLine(line.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <button
            type="button"
            disabled={
              isSubmitting || isAddingProduct || cartLines.length === 0
            }
            onClick={handleOpenBulkConfirm}
            className={`w-full py-3.5 text-base shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${aicraGradientCtaClass}`}
          >
            {isSubmitting
              ? "처리 중..."
              : `총 ${cartLines.length}건 일괄 접수 및 결제하기`}
          </button>
        </form>
          </div>
        </div>
      </div>
    </div>

    {isAgreementModalOpen ? (
      <div className="fixed inset-0 z-[45] flex items-center justify-center bg-black/50 p-4">
        <div
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="agreement-modal-title"
        >
          <h2
            id="agreement-modal-title"
            className="mb-4 text-xl font-bold text-gray-900"
          >
            서비스 대행 동의서
          </h2>

          <div className="max-h-[50vh] overflow-y-auto bg-white p-5 rounded border border-gray-200 text-sm text-gray-700 leading-relaxed mb-6">
            <h3 className="font-bold text-base text-gray-900 mb-2">
              1. 서비스 내용
            </h3>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>
                본 서비스는 일반 화장품 대상 FDA MoCRA 제품 리스팅 대행
                서비스이며, OTC Drug(기능성) 및 의약품 등록은 제외됩니다.
              </li>
              <li>
                고객사가 제공한 정보를 바탕으로 FDA 시스템 Cosmetics Direct에
                제품 리스팅을 등록합니다.
              </li>
            </ul>

            <h3 className="font-bold text-base text-gray-900 mb-2">
              2. 결과물 안내
            </h3>
            <ul className="list-disc pl-5 mb-4 space-y-1 text-red-600 font-medium">
              <li>
                FDA MoCRA 등록은 인증이나 허가가 아닙니다. 따라서 인증서,
                등록증, 라이선스 형태의 별도 결과물은 발급되지 않습니다.
              </li>
              <li className="text-gray-700 font-normal">
                등록 완료 후에는 제공해주신 이메일로 COSMETIC PRODUCT LISTING
                NUMBER를 전달해 드립니다.
              </li>
            </ul>

            <h3 className="font-bold text-base text-gray-900 mb-2">
              3. 고객사 준비 정보 (모두 영문 필수)
            </h3>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>브랜드명, 제품명, 제품 카테고리, 전성분표(INCI)</li>
              <li>제품 전/후면 패키지 이미지 (JPG 확장자)</li>
              <li>제조시설 FEI 번호 (제조사에 요청)</li>
              <li>Responsible Person 영문명, 연락처, 이메일 주소</li>
            </ul>

            <h3 className="font-bold text-base text-gray-900 mb-2">
              4. 소요 기간
            </h3>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>
                고객사의 자료 제출 및 결제가 모두 완료된 이후 통상 3일~7일 정도
                소요됩니다.
              </li>
            </ul>

            <h3 className="font-bold text-base text-gray-900 mb-2">
              5. 꼭 알아두실 사항 (법적 책임)
            </h3>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>
                본 서비스는 등록 대행 서비스이며, FDA의 제품 승인 서비스가
                아닙니다.
              </li>
              <li>
                등록이 완료되었다고 해서 제품의 안전성, 효능, 광고 표현, 미국
                내 판매 적법성까지 FDA가 보증하는 것은 아닙니다.
              </li>
              <li>
                FDA 가이드상 시설 등록(Facility Registration)과 제품
                리스팅(Product Listing)은 법적 제출 의무이며, 이를 이행하지
                않으면 위반 문제가 될 수 있습니다.
              </li>
            </ul>

            <h3 className="font-bold text-base text-gray-900 mb-2">
              6. 클레임 및 이상사례 대응
            </h3>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>
                고객이 제품 사용 후 중대한 이상사례가 발생하여 영문 라벨에
                기재된 귀사(Responsible Person)의 이메일로 관련 내용을 접수한
                경우, Responsible Person은 이를 15영업일 이내에 FDA에 보고해야
                합니다.
              </li>
              <li>
                따라서 미국 수출용 제품의 영문 라벨에는 실제로 확인 및 관리가
                가능한 귀사의 이메일 주소를 반드시 기재해야 하며, 접수된 클레임
                내용을 놓치지 않도록 철저히 운영되어야 합니다.
              </li>
            </ul>

            <h3 className="font-bold text-base text-gray-900 mb-2">
              7. 당사 서비스 책임 범위
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>당사는 MOCRA 제품 리스팅 전자제출을 대행합니다.</li>
              <li>
                아래 항목은 기본 서비스 범위에 포함되지 않습니다:
                <ul className="list-disc pl-5 mt-1 text-gray-500 text-sm">
                  <li>미국 법률 자문</li>
                  <li>통관 대행</li>
                  <li>광고 문구 법률 검토</li>
                  <li>패키지 디자인 수정</li>
                  <li>FDA 실사 대응</li>
                  <li>이상사례 보고 대행</li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="mt-6 space-y-3 border-t border-gray-200 pt-6">
            <p className="text-sm font-semibold text-gray-800">
              신청자 정보 (동의 시 공통 정보와 함께 유지됩니다)
            </p>
            <div>
              <label
                htmlFor="applicant-name"
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                기업명
              </label>
              <input
                id="applicant-name"
                name="applicantName"
                type="text"
                autoComplete="name"
                value={applicantName}
                onChange={(e) => {
                  const raw = e.target.value;
                  const sanitized = raw.replace(
                    /[^a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣0-9\s()&.-]/g,
                    "",
                  );
                  if (raw !== sanitized) {
                    setNameError(
                      "기업명은 영문, 한글, 숫자, 띄어쓰기 및 특수기호 ( ) & . - 만 입력 가능합니다.",
                    );
                  } else {
                    setNameError("");
                  }
                  setApplicantName(sanitized);
                  clearCommonRequiredKey("applicantName");
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ${
                  nameError !== "" || commonRequiredError.applicantName === true
                    ? "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:border-emerald-800 focus:ring-emerald-200"
                }`}
                placeholder="사업자등록증상의 기업명을 입력해주세요"
              />
              {nameError ? (
                <p className="text-red-500 text-xs mt-1">{nameError}</p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="applicant-phone"
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                연락처
              </label>
              <input
                id="applicant-phone"
                name="applicantPhone"
                type="tel"
                autoComplete="tel"
                value={applicantPhone}
                onChange={(e) => {
                  const raw = e.target.value;
                  const sanitized = raw.replace(/[^0-9-]/g, "");
                  if (raw !== sanitized) {
                    setPhoneError("숫자와 하이픈(-)만 입력 가능합니다.");
                  } else {
                    setPhoneError("");
                  }
                  setApplicantPhone(sanitized);
                  clearCommonRequiredKey("applicantPhone");
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ${
                  phoneError !== "" ||
                  commonRequiredError.applicantPhone === true
                    ? "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:border-emerald-800 focus:ring-emerald-200"
                }`}
                placeholder="예: 010-1234-5678"
              />
              {phoneError ? (
                <p className="text-red-500 text-xs mt-1">{phoneError}</p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="applicant-email"
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                이메일 주소
              </label>
              <input
                id="applicant-email"
                name="applicantEmail"
                type="email"
                autoComplete="email"
                value={applicantEmail}
                onChange={(e) => {
                  const raw = e.target.value;
                  const sanitized = raw.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
                  if (raw !== sanitized) {
                    setEmailError("이메일에는 한글을 사용할 수 없습니다.");
                  } else {
                    setEmailError("");
                  }
                  setApplicantEmail(sanitized);
                  clearCommonRequiredKey("applicantEmail");
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ${
                  emailError !== "" ||
                  commonRequiredError.applicantEmail === true
                    ? "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:border-emerald-800 focus:ring-emerald-200"
                }`}
                placeholder="example@email.com"
              />
              {emailError ? (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => setIsAgreementModalOpen(false)}
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleAgreementSave}
              className="w-full rounded-lg bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-stone-50 transition-colors hover:bg-emerald-900 sm:w-auto"
            >
              위 내용에 동의하고 적용하기
            </button>
          </div>
        </div>
      </div>
    ) : null}

    {isConfirmModalOpen ? (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div
          className="bg-white p-6 rounded-lg w-full max-w-md mx-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <h2
            id="confirm-modal-title"
            className="text-xl font-bold mb-4 text-red-600"
          >
            최종 확인 및 주의사항
          </h2>
          <p className="mb-3 font-semibold text-gray-800">
            입력하신 모든 정보가 정확한지 다시 한번 확인해 주셨습니까?
          </p>
          <p
            className={`mb-3 rounded-md border border-emerald-950/10 bg-stone-100/50 px-3 py-2 text-sm font-medium leading-relaxed text-emerald-900 ${kb}`}
          >
            접수 목록에{" "}
            <span className="font-bold text-emerald-950">{cartLines.length}건</span>
            이(가) 반영되어 있습니다. 아래에 동의하시면 결제·마무리 단계로
            이동합니다.
          </p>
          <div className="mb-6 text-sm text-gray-700 bg-gray-100 p-4 rounded-md leading-relaxed border border-gray-200">
            잘못된 정보 입력, 오타, 또는 허위 문서 첨부로 인해 발생하는 미국
            MoCRA 등록 지연 및 거절에 대한 모든 법적·금전적 책임은
            신청자(고객) 본인에게 귀속됩니다. 제출 전 입력 내용을 다시 한번
            꼼꼼히 확인해 주시기 바랍니다.
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsConfirmModalOpen(false)}
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              돌아가기
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleFinalSubmit()}
              className="w-full rounded-lg bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-stone-50 transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? "처리 중..." : "동의 및 최종 제출"}
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
