"use client";

import {
  EVENTS,
  Joyride,
  STATUS,
  type EventHandler,
  type Step,
} from "react-joyride";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const TUTORIAL_STORAGE_KEY = "tutorial_completed";
const CONTINUE_SESSION_KEY = "aicra_apply_tour_continue";

function readTutorialDone(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
  } catch {
    return true;
  }
}

function persistTutorialDone() {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    sessionStorage.removeItem(CONTINUE_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function setContinueFlag() {
  try {
    sessionStorage.setItem(CONTINUE_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

function readContinueFlag(): boolean {
  try {
    return sessionStorage.getItem(CONTINUE_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

const stepsPart1: Step[] = [
  {
    target: ".tour-step-1",
    title: "1 / 5",
    content: "안전한 등록을 위해 약관을 읽고 동의해 주세요.",
    placement: "bottom",
  },
  {
    target: ".tour-step-2",
    title: "2 / 5",
    content:
      "FDA에 등록될 기업 및 책임자(RP) 정보를 정확히 영문으로 입력해 주세요.",
    placement: "bottom",
  },
];

const stepsPart2: Step[] = [
  {
    target: ".tour-step-3",
    title: "3 / 5",
    content: "화장품의 공식 영문 제품명과 브랜드를 적는 곳입니다.",
    placement: "bottom",
  },
  {
    target: ".tour-step-4",
    title: "4 / 5",
    content:
      "화장품 뒷면의 성분표 사진을 찍어 올리시면, AI가 영문 성분명만 쏙쏙 뽑아냅니다.",
    placement: "top",
  },
  {
    target: ".tour-step-5",
    title: "5 / 5",
    content:
      "제품의 특징(예: 수분크림)을 입력하고 검색을 누르시면, AI가 미국 FDA 기준에 맞는 카테고리를 찾아줍니다.",
    placement: "bottom",
  },
];

const joyrideLocale = {
  back: "이전",
  close: "닫기",
  last: "완료",
  next: "다음",
  skip: "건너뛰기",
};

const joyrideStyles = {
  tooltip: {
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 12px 40px rgba(2, 44, 34, 0.18)",
    border: "1px solid rgba(180, 83, 9, 0.35)",
  },
  tooltipTitle: {
    color: "#022c22",
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 8,
  },
  tooltipContent: {
    color: "#44403c",
    fontSize: 14,
    lineHeight: 1.55,
    padding: 0,
  },
  buttonPrimary: {
    backgroundColor: "#022c22",
    color: "#fef3c7",
    fontWeight: 600,
    fontSize: 13,
    borderRadius: 8,
    outline: "none",
  },
  buttonBack: {
    color: "#022c22",
    fontWeight: 600,
    fontSize: 13,
    marginRight: 8,
  },
  buttonSkip: {
    color: "#57534e",
    fontWeight: 600,
    fontSize: 13,
  },
  buttonClose: {
    color: "#57534e",
  },
};

export function ApplyOnboardingTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tutorialDone, setTutorialDone] = useState(true);
  const [run, setRun] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTutorialDone(readTutorialDone());
  }, []);

  const steps = useMemo(() => {
    if (pathname === "/apply/step1") return stepsPart1;
    if (pathname === "/apply/step2") return stepsPart2;
    return [];
  }, [pathname]);

  useEffect(() => {
    if (!mounted || tutorialDone || steps.length === 0) {
      setRun(false);
      return;
    }

    if (pathname === "/apply/step1") {
      if (readContinueFlag()) {
        setRun(false);
        return;
      }
      const t = window.setTimeout(() => setRun(true), 200);
      return () => window.clearTimeout(t);
    }

    if (pathname === "/apply/step2") {
      if (!readContinueFlag()) {
        setRun(false);
        return;
      }
      const t = window.setTimeout(() => setRun(true), 280);
      return () => window.clearTimeout(t);
    }

    setRun(false);
  }, [mounted, tutorialDone, pathname, steps.length]);

  const onEvent = useCallback<EventHandler>(
    (data) => {
      if (data.type === EVENTS.TOUR_STATUS) {
        if (data.status === STATUS.SKIPPED) {
          persistTutorialDone();
          setTutorialDone(true);
          setRun(false);
          return;
        }
        if (data.status === STATUS.FINISHED) {
          if (pathname === "/apply/step1") {
            setRun(false);
            setContinueFlag();
            router.push("/apply/step2");
            return;
          }
          if (pathname === "/apply/step2") {
            persistTutorialDone();
            setTutorialDone(true);
            setRun(false);
          }
        }
      }
    },
    [pathname, router],
  );

  if (!mounted || tutorialDone || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      key={`${pathname}-${steps.length}`}
      run={run}
      steps={steps}
      continuous
      scrollToFirstStep
      locale={joyrideLocale}
      styles={joyrideStyles}
      options={{
        primaryColor: "#022c22",
        textColor: "#1c1917",
        backgroundColor: "#fffbeb",
        overlayColor: "rgba(2, 44, 34, 0.45)",
        arrowColor: "#fffbeb",
        scrollDuration: 600,
        scrollOffset: 96,
        showProgress: false,
        skipBeacon: true,
        buttons: ["back", "close", "primary", "skip"],
        zIndex: 59,
      }}
      onEvent={onEvent}
    />
  );
}
