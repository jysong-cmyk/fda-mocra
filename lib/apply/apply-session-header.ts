/**
 * MOCRA 비회원 세션: Supabase 요청 헤더명.
 * PostgREST는 헤더 키를 소문자로 `request.headers` JSON에 넣습니다.
 */
export const APPLY_SESSION_ID_HEADER = "x-apply-session-id";

export function createApplySessionId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
