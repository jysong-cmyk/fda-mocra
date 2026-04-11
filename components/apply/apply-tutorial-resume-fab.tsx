"use client";

import {
  APPLY_TUTORIAL_COMPLETED_EVENT,
  APPLY_TUTORIAL_RESTARTED_EVENT,
  APPLY_TUTORIAL_RESUME_EVENT,
  readTutorialDoneFromStorage,
  TUTORIAL_STORAGE_KEY,
} from "@/lib/apply/tutorial-constants";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/** 튜토리얼 완료 후 apply 1·2단계에서만 표시되는 가이드 다시 보기 플로팅 버튼 */
export function ApplyTutorialResumeFab() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const sync = useCallback(() => {
    const onApply =
      pathname === "/apply/step1" || pathname === "/apply/step2";
    setVisible(onApply && readTutorialDoneFromStorage());
  }, [pathname]);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TUTORIAL_STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [sync]);

  useEffect(() => {
    const onDone = () => sync();
    window.addEventListener(APPLY_TUTORIAL_COMPLETED_EVENT, onDone);
    window.addEventListener(APPLY_TUTORIAL_RESTARTED_EVENT, onDone);
    return () => {
      window.removeEventListener(APPLY_TUTORIAL_COMPLETED_EVENT, onDone);
      window.removeEventListener(APPLY_TUTORIAL_RESTARTED_EVENT, onDone);
    };
  }, [sync]);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="가이드 다시 보기"
      className="fixed bottom-24 right-6 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-[#022c22] text-lg font-bold text-white shadow-lg transition hover:bg-emerald-950"
      onClick={() => {
        window.dispatchEvent(new CustomEvent(APPLY_TUTORIAL_RESUME_EVENT));
      }}
    >
      ?
    </button>
  );
}
