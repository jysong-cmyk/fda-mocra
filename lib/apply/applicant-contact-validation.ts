/**
 * 동의 모달·튜토리얼 가드·저장 검증 공통.
 * +국가번호- 는 맨 앞에서 선택 적용 후, (3단: 1~3-3~4-4) 또는 (2단: 4-4, 예: 1588-1234).
 */
export const APPLICANT_PHONE_REGEX =
  /^(\+\d{1,3}-)?(\d{1,3}-\d{3,4}-\d{4}|\d{4}-\d{4})$/;

/** 로컬(@ 포함) 이메일 형식 검사용 */
export const APPLICANT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isApplicantPhoneFormatValid(phone: string): boolean {
  return APPLICANT_PHONE_REGEX.test(phone.trim());
}

/**
 * 1단계 RP·신청자(제출) 등 국제 라벨용: 반드시 선행 `+` 후 국가번호·번호.
 * 동의서 입력칸은 `isApplicantPhoneFormatValid` 유지.
 */
export function isInternationalPhoneFormatValid(phone: string): boolean {
  const t = phone.trim();
  if (!t.startsWith("+")) return false;
  if (t.length < 9) return false;
  if (!/^\+[0-9\- \.]+$/.test(t)) return false;
  const digits = t.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/** 1단계 국제 전화 onBlur·제출 실패 시 안내 */
export const INTERNATIONAL_PHONE_BLUR_ALERT =
  "국가번호(+)를 포함한 정확한 양식을 입력해주세요. (예: +82-10-1234-5678)";

export function isApplicantEmailFormatValid(email: string): boolean {
  return APPLICANT_EMAIL_REGEX.test(email.trim());
}

/** 제조시설 FEI: 숫자 정확히 10자리만 허용 */
export const FEI_NUMBER_REGEX = /^\d{10}$/;

export function isFeiNumberValid(fei: string): boolean {
  return FEI_NUMBER_REGEX.test(fei.trim());
}

/** 폼 onBlur 실시간 검사 — 전화·이메일 형식 오류 시 공통 안내 */
export const APPLICANT_FORMAT_BLUR_ALERT =
  "정확한 이메일(또는 전화번호) 양식을 입력해주세요.";

/** FEI 입력칸 onBlur 형식 오류 안내 */
export const FEI_FORMAT_BLUR_ALERT =
  "제조사 FEI 번호는 숫자 10자리로 입력해 주세요.";
