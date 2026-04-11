/** 동의 모달·튜토리얼 가드·저장 검증 공통: 국제 전화 형식 (+국번-구간-구간-4자리) */
export const APPLICANT_PHONE_REGEX =
  /^\+\d{1,3}-\d{2,3}-\d{3,4}-\d{4}$/;

/** 로컬(@ 포함) 이메일 형식 검사용 */
export const APPLICANT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isApplicantPhoneFormatValid(phone: string): boolean {
  return APPLICANT_PHONE_REGEX.test(phone.trim());
}

export function isApplicantEmailFormatValid(email: string): boolean {
  return APPLICANT_EMAIL_REGEX.test(email.trim());
}
