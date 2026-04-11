/** 영문 RP명·제품명 — 하이픈은 클래스 끝에 두어 +-/ 범위 오해 방지 */
export const RP_PRODUCT_NAME_REGEX = /^[a-zA-Z0-9\s.,&'()+\/\-]*$/;

/** 카테고리 빠른 검색 입력 패턴 */
export const AI_CATEGORY_QUERY_REGEX =
  /^[a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ0-9\s/+%.,\-]*$/;

export type AiRecommendation = {
  pathLabel: string;
  category1: string;
  category2: string;
  category3: string;
};

export type ProductFieldKey =
  | "productNameEn"
  | "category"
  | "fei"
  | "labels"
  | "ingredientImage"
  | "ingredientText"
  | "ingredientConfirm";

export type CommonRequiredKey =
  | "agreement"
  | "rpNameEn"
  | "rpContact"
  | "applicantName"
  | "applicantPhone"
  | "applicantEmail";

/** 서버에 반영된 제품 행 id + 목록·수정용 */

/** Vercel 등 서버리스 요청 본문 한도(~4.5MB)를 고려한 성분표 파일 상한 */
export const MAX_INGREDIENT_FILE_SIZE_MB = 4 as const;
export const MAX_INGREDIENT_FILE_BYTES =
  MAX_INGREDIENT_FILE_SIZE_MB * 1024 * 1024;

/** Step2 성분표 업로드 `<input accept>` — PNG, JPEG, JPG */
export const INGREDIENT_FILE_ACCEPT_ATTR =
  "image/png,image/jpeg,image/jpg" as const;

export const INGREDIENT_UPLOAD_MIME_WHITELIST = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

/** 클라이언트 선검증: MIME 또는 확장자(.png/.jpg/.jpeg) */
export function isIngredientUploadClientAllowed(file: File): boolean {
  const m = (file.type ?? "").trim().toLowerCase();
  if (m !== "" && INGREDIENT_UPLOAD_MIME_WHITELIST.has(m)) return true;
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  );
}

export type CartLine = {
  id: string;
  /** 비회원 apply 세션 UUID — DB `session_id`·삭제 시 로컬과 일치 검증 */
  sessionId: string;
  productNameEn: string;
  category1: string;
  category2: string;
  category3: string;
  feiNumber: string;
  ingredientText: string;
  labelImageUrl: string;
  rpNameEn: string;
  rpContact: string;
  agentName: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
};

export function pathLabelFrom(
  category1: string,
  category2: string,
  category3: string,
): string {
  return `${category1} > ${category2} > ${category3}`;
}
