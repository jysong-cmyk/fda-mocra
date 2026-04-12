export const TUTORIAL_STORAGE_KEY = "tutorial_completed";

/** step2 이어하기 등 — 투어와 동일 키를 쓰므로 완료 시 함께 제거 */
export const APPLY_TUTORIAL_CONTINUE_SESSION_KEY = "aicra_apply_tour_continue";

export const APPLY_TUTORIAL_RESUME_EVENT = "aicra-apply-tutorial-resume";

/** Step2: 카테고리 AI 검색 요청이 끝난 뒤(성공/실패) 투어가 검색 스텝이면 다음 스텝으로 진행 */
export const APPLY_TUTORIAL_AI_SEARCH_FINISHED_EVENT =
  "aicra-apply-tutorial-ai-search-finished";

/** Step2: 카테고리 최종 확인 버튼 클릭 후 투어 다음 스텝(FEI)으로 진행 */
export const APPLY_TUTORIAL_CATEGORY_CONFIRM_NEXT_EVENT =
  "aicra-apply-tutorial-category-confirm-next";

/** Step2: 성분표 OCR 성공 후 투어가 업로드 스텝(7/9)이면 성분 검토 스텝(8/9)으로 진행 */
export const APPLY_TUTORIAL_INGREDIENT_OCR_SUCCESS_EVENT =
  "aicra-apply-tutorial-ingredient-ocr-success";

/** Step2: [성분표 확인] 클릭 후 투어가 성분 검토 스텝(8/9)이면 저장 버튼 스텝(9/9)으로 진행 */
export const APPLY_TUTORIAL_INGREDIENT_CONFIRMED_EVENT =
  "aicra-apply-tutorial-ingredient-confirmed";
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
