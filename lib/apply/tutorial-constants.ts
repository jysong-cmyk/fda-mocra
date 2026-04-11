export const TUTORIAL_STORAGE_KEY = "tutorial_completed";

/** step2 이어하기 등 — 투어와 동일 키를 쓰므로 완료 시 함께 제거 */
export const APPLY_TUTORIAL_CONTINUE_SESSION_KEY = "aicra_apply_tour_continue";

export const APPLY_TUTORIAL_RESUME_EVENT = "aicra-apply-tutorial-resume";
export const APPLY_TUTORIAL_COMPLETED_EVENT = "aicra-tutorial-completed";
export const APPLY_TUTORIAL_RESTARTED_EVENT = "aicra-tutorial-restarted";

export function readTutorialDoneFromStorage(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
  } catch {
    return true;
  }
}

export function dispatchTutorialCompleted() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(APPLY_TUTORIAL_COMPLETED_EVENT));
}

/**
 * 튜토리얼을 완료로 고정합니다. Joyride가 STATUS.FINISHED를 못 받는 경우(예: 2단계
 * 마지막 스텝에서 실제 저장만 하고 투어를 닫지 않은 채 성공)에도 좀비 재시작을 막습니다.
 */
export function persistApplyTutorialDone(): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    sessionStorage.removeItem(APPLY_TUTORIAL_CONTINUE_SESSION_KEY);
    dispatchTutorialCompleted();
  } catch {
    /* ignore */
  }
}

export function dispatchTutorialRestarted() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(APPLY_TUTORIAL_RESTARTED_EVENT));
}
