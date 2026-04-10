"use client";

import {
  EVENTS,
  Joyride,
  STATUS,
  type ButtonType,
  type EventHandler,
  type Options,
  type Step,
} from "react-joyride";
import { useApplyStore } from "@/stores/apply-store";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TUTORIAL_STORAGE_KEY = "tutorial_completed";
const CONTINUE_SESSION_KEY = "aicra_apply_tour_continue";

type Step1Phase = "cta" | "modal" | "rp";

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

const step1CtaStep: Step = {
  target: ".tour-step-1",
  title: "1 단계",
  content:
    "안전한 등록을 위해 약관을 읽고 동의해 주세요. 이 영역의 버튼을 눌러 동의서 창을 여세요.",
  placement: "bottom",
};

const step1ModalSteps: Step[] = [
  {
    target: "#tour-step-1-company",
    title: "1-1 · 기업명",
    content: "FDA 등록에 쓰일 정확한 영문 기업명을 입력하세요.",
    placement: "bottom",
  },
  {
    target: "#tour-step-1-contact",
    title: "1-2 · 연락처",
    content: "비상시에 연락 가능한 유효한 연락처를 입력하세요.",
    placement: "bottom",
  },
  {
    target: "#tour-step-1-email",
    title: "1-3 · 이메일",
    content: "등록 완료 보고서를 받을 주요 이메일 주소입니다.",
    placement: "bottom",
  },
  {
    target: "#tour-step-1-submit",
    title: "1-4 · 동의",
    content: "입력을 마치셨다면, 동의하고 다음 단계로 진행하세요.",
    placement: "top",
  },
];

const step1RpStep: Step = {
  target: ".tour-step-2",
  title: "2 / 5",
  content:
    "FDA에 등록될 기업 및 책임자(RP) 정보를 정확히 영문으로 입력해 주세요.",
  placement: "bottom",
};

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

const joyrideOptionsAboveModal: Partial<Options> = {
  primaryColor: "#022c22",
  textColor: "#1c1917",
  backgroundColor: "#fffbeb",
  overlayColor: "rgba(2, 44, 34, 0.45)",
  arrowColor: "#fffbeb",
  scrollDuration: 600,
  scrollOffset: 96,
  showProgress: false,
  skipBeacon: true,
  buttons: ["back", "close", "primary", "skip"] as ButtonType[],
  /** 동의 모달 z-[60]보다 위 */
  zIndex: 100,
  targetWaitTimeout: 3000,
  /** 하이라이트 영역에서도 입력·클릭 가능 */
  blockTargetInteraction: false,
};

export function ApplyOnboardingTour() {
  const pathname = usePathname();
  const router = useRouter();
  const isAgreementModalOpen = useApplyStore((s) => s.isAgreementModalOpen);

  const [mounted, setMounted] = useState(false);
  const [tutorialDone, setTutorialDone] = useState(true);
  const [run, setRun] = useState(false);
  const [step1Phase, setStep1Phase] = useState<Step1Phase>("cta");
  const [pendingRpAfterModal, setPendingRpAfterModal] = useState(false);
  const [joyrideCycle, setJoyrideCycle] = useState(0);

  const step1PhaseRef = useRef(step1Phase);
  step1PhaseRef.current = step1Phase;

  useEffect(() => {
    setMounted(true);
    setTutorialDone(readTutorialDone());
  }, []);

  const steps = useMemo(() => {
    if (pathname === "/apply/step1") {
      if (step1Phase === "cta") return [step1CtaStep];
      if (step1Phase === "modal") return step1ModalSteps;
      return [step1RpStep];
    }
    if (pathname === "/apply/step2") return stepsPart2;
    return [];
  }, [pathname, step1Phase]);

  /**
   * 동의서 모달이 열리면: Joyride를 멈춘 뒤 200ms만 대기해 React DOM 마운트 틱 이후
   * modal 단계로 전환하고 투어를 다시 실행합니다.
   */
  useEffect(() => {
    if (
      !mounted ||
      tutorialDone ||
      pathname !== "/apply/step1" ||
      readContinueFlag()
    ) {
      return;
    }
    if (!isAgreementModalOpen || step1Phase !== "cta") return;

    setRun(false);

    let cancelled = false;
    const delayMs = 200;
    const timerId = window.setTimeout(() => {
      if (cancelled) return;
      setStep1Phase("modal");
      setJoyrideCycle((c) => c + 1);
      setRun(true);
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [mounted, tutorialDone, pathname, isAgreementModalOpen, step1Phase]);

  /** 모달 안내 4단계를 끝낸 뒤 모달이 닫히면 RP 단계로 */
  useEffect(() => {
    if (
      !mounted ||
      tutorialDone ||
      pathname !== "/apply/step1" ||
      !pendingRpAfterModal ||
      isAgreementModalOpen
    ) {
      return;
    }

    setPendingRpAfterModal(false);
    setStep1Phase("rp");
    setJoyrideCycle((c) => c + 1);
    const t = window.setTimeout(() => setRun(true), 220);
    return () => window.clearTimeout(t);
  }, [
    mounted,
    tutorialDone,
    pathname,
    pendingRpAfterModal,
    isAgreementModalOpen,
  ]);

  /** 모달 단계 중 닫기만 하고 이탈한 경우 CTA로 복귀 */
  useEffect(() => {
    if (
      !mounted ||
      tutorialDone ||
      pathname !== "/apply/step1" ||
      isAgreementModalOpen ||
      step1Phase !== "modal" ||
      pendingRpAfterModal
    ) {
      return;
    }

    setStep1Phase("cta");
    setJoyrideCycle((c) => c + 1);
    setRun(false);
    const t = window.setTimeout(() => setRun(true), 220);
    return () => window.clearTimeout(t);
  }, [
    mounted,
    tutorialDone,
    pathname,
    isAgreementModalOpen,
    step1Phase,
    pendingRpAfterModal,
  ]);

  /** 1단계 CTA / RP 구간에서 투어 시작 (모달 전용 구간은 별도 이펙트에서 처리) */
  useEffect(() => {
    if (!mounted || tutorialDone || pathname !== "/apply/step1") {
      return;
    }
    if (readContinueFlag()) {
      setRun(false);
      return;
    }
    if (step1Phase === "modal") {
      return;
    }

    const t = window.setTimeout(
      () => setRun(true),
      step1Phase === "rp" ? 220 : 200,
    );
    return () => window.clearTimeout(t);
  }, [mounted, tutorialDone, pathname, step1Phase]);

  useEffect(() => {
    if (!mounted || tutorialDone || pathname !== "/apply/step2") {
      return;
    }
    if (!readContinueFlag()) {
      setRun(false);
      return;
    }
    const t = window.setTimeout(() => setRun(true), 280);
    return () => window.clearTimeout(t);
  }, [mounted, tutorialDone, pathname]);

  const onEvent = useCallback<EventHandler>(
    (data) => {
      if (data.type !== EVENTS.TOUR_STATUS) return;

      if (data.status === STATUS.SKIPPED) {
        persistTutorialDone();
        setTutorialDone(true);
        setRun(false);
        return;
      }

      if (data.status !== STATUS.FINISHED) return;

      if (pathname === "/apply/step1") {
        const phase = step1PhaseRef.current;

        if (phase === "cta") {
          if (!useApplyStore.getState().isAgreementModalOpen) {
            setRun(false);
            setJoyrideCycle((c) => c + 1);
            window.setTimeout(() => setRun(true), 120);
          }
          return;
        }

        if (phase === "modal") {
          setPendingRpAfterModal(true);
          setRun(false);
          if (!useApplyStore.getState().isAgreementModalOpen) {
            setPendingRpAfterModal(false);
            setStep1Phase("rp");
            setJoyrideCycle((c) => c + 1);
            window.setTimeout(() => setRun(true), 200);
          }
          return;
        }

        if (phase === "rp") {
          setRun(false);
          setContinueFlag();
          router.push("/apply/step2");
        }
        return;
      }

      if (pathname === "/apply/step2") {
        persistTutorialDone();
        setTutorialDone(true);
        setRun(false);
      }
    },
    [pathname, router],
  );

  if (!mounted || tutorialDone || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      key={`${pathname}-${step1Phase}-${joyrideCycle}-${steps.length}`}
      run={run}
      steps={steps}
      continuous
      scrollToFirstStep
      locale={joyrideLocale}
      styles={joyrideStyles}
      options={{ ...joyrideOptionsAboveModal }}
      onEvent={onEvent}
    />
  );
}
