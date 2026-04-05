import {
  AI_CATEGORY_QUERY_REGEX,
  RP_PRODUCT_NAME_REGEX,
} from "@/lib/apply/types-and-constants";

/** Step2 FormData 키 — 클라이언트·서버 동일하게 사용 */
export const APPLY_SAVE_PRODUCT_FIELD = {
  sessionId: "session_id",
  editingId: "editing_id",
  labels: "labels",
  isAgreed: "is_agreed",
  hasIngredientImage: "has_ingredient_image",
  ingredientConfirmed: "ingredient_confirmed",
  rpNameEn: "rp_name_en",
  rpContact: "rp_contact",
  agentName: "agent_name",
  applicantName: "applicant_name",
  applicantPhone: "applicant_phone",
  applicantEmail: "applicant_email",
  productNameEn: "product_name_en",
  category1: "category1",
  category2: "category2",
  category3: "category3",
  feiNumber: "fei_number",
  ingredientText: "ingredient_text",
  aiCategoryQuery: "ai_category_query",
} as const;

export type ApplyProductFormStrings = {
  isAgreed: string;
  rpNameEn: string;
  rpContact: string;
  agentName: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  productNameEn: string;
  category1: string;
  category2: string;
  category3: string;
  feiNumber: string;
  ingredientText: string;
  ingredientConfirmed: string;
  aiCategoryQuery: string;
};

/** FormData에서 문자열 필드만 안전하게 읽기 */
export function readApplyProductFormStrings(
  formData: FormData,
): ApplyProductFormStrings {
  const g = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : String(v ?? "");
  };
  const F = APPLY_SAVE_PRODUCT_FIELD;
  return {
    isAgreed: g(F.isAgreed),
    rpNameEn: g(F.rpNameEn),
    rpContact: g(F.rpContact),
    agentName: g(F.agentName),
    applicantName: g(F.applicantName),
    applicantPhone: g(F.applicantPhone),
    applicantEmail: g(F.applicantEmail),
    productNameEn: g(F.productNameEn),
    category1: g(F.category1),
    category2: g(F.category2),
    category3: g(F.category3),
    feiNumber: g(F.feiNumber),
    ingredientText: g(F.ingredientText),
    ingredientConfirmed: g(F.ingredientConfirmed),
    aiCategoryQuery: g(F.aiCategoryQuery),
  };
}

/**
 * 서버 측 검증. 통과 시 trim 된 페이로드 반환, 실패 시 에러 문구.
 */
export function validateApplyProductFormServer(
  raw: ApplyProductFormStrings,
  opts: {
    isInsert: boolean;
    labelFileCount: number;
    /** 수정 시 DB에 남아 있는 라벨 URL 유무 */
    hasExistingLabelUrls: boolean;
    /** 신규 등록 시 성분표 파일 선택 여부(클라이언트 플래그) */
    hasIngredientImageMeta: boolean;
  },
):
  | {
      ok: true;
      payload: {
        rpNameEn: string;
        rpContact: string;
        agentName: string;
        applicantName: string;
        applicantPhone: string;
        applicantEmail: string;
        productNameEn: string;
        category1: string;
        category2: string;
        category3: string;
        feiNumber: string;
        ingredientText: string;
        recommenderName: string;
      };
    }
  | { ok: false; error: string } {
  if (raw.isAgreed !== "1") {
    return { ok: false, error: "이용약관 및 개인정보 처리에 동의해 주세요." };
  }

  const rpNameEn = raw.rpNameEn.trim();
  const rpContact = raw.rpContact.trim();
  const applicantName = raw.applicantName.trim();
  const applicantPhone = raw.applicantPhone.trim();
  const applicantEmail = raw.applicantEmail.trim();
  const productNameEn = raw.productNameEn.trim();
  const category1 = raw.category1.trim();
  const category2 = raw.category2.trim();
  const category3 = raw.category3.trim();
  const feiNumber = raw.feiNumber.trim();
  const ingredientText = raw.ingredientText.trim();
  const agentName = raw.agentName.trim();
  const recommenderName = agentName.replace(/\s+/g, "");

  if (rpNameEn === "") {
    return { ok: false, error: "RP명(영문)을 입력해 주세요." };
  }
  if (!RP_PRODUCT_NAME_REGEX.test(rpNameEn)) {
    return { ok: false, error: "RP명(영문) 입력 형식을 확인해 주세요." };
  }
  if (rpContact === "") {
    return { ok: false, error: "RP 연락처를 입력해 주세요." };
  }
  if (rpContact.replace(/[^0-9-+]/g, "") !== rpContact) {
    return { ok: false, error: "RP 연락처는 숫자, +, - 만 사용할 수 있습니다." };
  }
  if (applicantName === "") {
    return { ok: false, error: "신청자 기업명을 입력해 주세요." };
  }
  if (/[^a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣0-9\s()&.-]/.test(applicantName)) {
    return {
      ok: false,
      error:
        "신청자 기업명은 영문, 한글, 숫자, 띄어쓰기 및 ( ) & . - 만 사용할 수 있습니다.",
    };
  }
  if (applicantPhone === "") {
    return { ok: false, error: "연락처를 입력해 주세요." };
  }
  if (/[^0-9-]/.test(applicantPhone)) {
    return { ok: false, error: "연락처는 숫자와 하이픈(-)만 입력할 수 있습니다." };
  }
  if (applicantEmail === "") {
    return { ok: false, error: "이메일을 입력해 주세요." };
  }
  if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(applicantEmail)) {
    return { ok: false, error: "이메일에는 한글을 사용할 수 없습니다." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
    return { ok: false, error: "이메일 형식을 확인해 주세요." };
  }

  if (productNameEn === "") {
    return { ok: false, error: "제품명(영문)을 입력해 주세요." };
  }
  if (!RP_PRODUCT_NAME_REGEX.test(productNameEn)) {
    return { ok: false, error: "제품명(영문) 입력 형식을 확인해 주세요." };
  }
  if (category1 === "" || category2 === "" || category3 === "") {
    return { ok: false, error: "카테고리를 모두 선택해 주세요." };
  }
  if (feiNumber === "") {
    return { ok: false, error: "FEI 번호를 입력해 주세요." };
  }

  if (opts.isInsert) {
    if (!opts.hasIngredientImageMeta) {
      return { ok: false, error: "성분표 이미지를 업로드해 주세요." };
    }
    if (opts.labelFileCount === 0) {
      return { ok: false, error: "영문 패키지(라벨) 이미지를 업로드해 주세요." };
    }
  } else {
    if (opts.labelFileCount === 0 && !opts.hasExistingLabelUrls) {
      return { ok: false, error: "라벨 이미지는 필수입니다." };
    }
  }

  if (ingredientText === "") {
    return { ok: false, error: "성분(전성분)을 입력해 주세요." };
  }
  if (raw.ingredientConfirmed !== "1") {
    return { ok: false, error: "성분 내용 확인에 체크해 주세요." };
  }

  const aiQ = raw.aiCategoryQuery.trim();
  if (aiQ !== "" && !AI_CATEGORY_QUERY_REGEX.test(aiQ)) {
    return { ok: false, error: "카테고리 검색 입력 형식을 확인해 주세요." };
  }

  return {
    ok: true,
    payload: {
      rpNameEn,
      rpContact,
      agentName,
      applicantName,
      applicantPhone,
      applicantEmail,
      productNameEn,
      category1,
      category2,
      category3,
      feiNumber,
      ingredientText,
      recommenderName,
    },
  };
}
