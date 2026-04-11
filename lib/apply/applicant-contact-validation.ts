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

export function isApplicantEmailFormatValid(email: string): boolean {
  return APPLICANT_EMAIL_REGEX.test(email.trim());
}

/** 제조시설 FEI: 숫자 정확히 10자리만 허용 */
export const FEI_NUMBER_REGEX = /^\d{10}$/;

export function isFeiNumberValid(fei: string): boolean {
  return FEI_NUMBER_REGEX.test(fei.trim());
}
