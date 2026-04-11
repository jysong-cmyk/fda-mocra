export const TUTORIAL_STORAGE_KEY = "tutorial_completed";

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

export function dispatchTutorialRestarted() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(APPLY_TUTORIAL_RESTARTED_EVENT));
}
