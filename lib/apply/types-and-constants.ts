/** 영문 RP명·제품명 — 하이픈은 클래스 끝에 두어 +-/ 범위 오해 방지 */
export const RP_PRODUCT_NAME_REGEX = /^[a-zA-Z0-9\s.,&'()+\/\-]*$/;

/** 카테고리 빠른 검색 입력 패턴 */
export const AI_CATEGORY_QUERY_REGEX =
  /^[a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ0-9\s/+%.,\-]*$/;

export const FAKE_OCR_TEXT =
  "Water, Glycerin, Butylene Glycol, Niacinamide...";

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
