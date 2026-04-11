"use client";

import {
  EVENTS,
  Joyride,
  ORIGIN,
  STATUS,
  type ButtonType,
  type Controls,
  type EventHandler,
  type Options,
  type Step,
  type TooltipRenderProps,
} from "react-joyride";
import {
  APPLY_TUTORIAL_RESUME_EVENT,
  dispatchTutorialCompleted,
  dispatchTutorialRestarted,
  readTutorialDoneFromStorage,
  TUTORIAL_STORAGE_KEY,
} from "@/lib/apply/tutorial-constants";
import { useApplyStore, type ApplyStore } from "@/stores/apply-store";
import { usePathname } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

const CONTINUE_SESSION_KEY = "aicra_apply_tour_continue";

/** Tab/Enter로 자동 Next 하지 않는 스텝 (v3: overlay/ESC는 overlayClickAction·dismissKeyAction 사용) */
const KEYBOARD_NEXT_EXCLUDED_TARGETS = new Set<string>([
  "#tour-step-next-btn",
  "#tour-step-1-submit",
]);

/** Primary(다음)/Tab·Enter 전 값 검사 대상 (선택 추천인 제외) */
const INPUT_GUARD_TARGETS = new Set<string>([
  "#tour-step-1-company",
  "#tour-step-1-contact",
  "#tour-step-1-email",
  "#tour-step-rp-name",
  "#tour-step-rp-contact",
  ".tour-step-3",
  ".tour-step-4",
  ".tour-step-5",
]);

function getTourFieldValue(selector: string): string {
  try {
    if (selector === ".tour-step-4") {
      const st = useApplyStore.getState();
      if ((st.labelFiles?.length ?? 0) > 0) return "x";
      if ((st.ingredientText ?? "").trim() !== "") return "x";
      const fileInput = document.querySelector<HTMLInputElement>(".tour-step-4");
      if (fileInput?.type === "file" && (fileInput.files?.length ?? 0) > 0) {
        return "x";
      }
      return "";
    }
    if (selector === ".tour-step-5") {
      return (useApplyStore.getState().aiCategoryQuery ?? "").trim();
    }
    const el = document.querySelector(selector);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      if (el instanceof HTMLInputElement && el.type === "file") {
        return el.files?.length ? "x" : "";
      }
      return el.value.trim();
    }
  } catch {
    /* ignore */
  }
  return "";
}

function focusTourTargetForStep(selector: string) {
  try {
    if (selector === ".tour-step-5") {
      document.querySelector<HTMLElement>("#apply-ai-cat")?.focus({
        preventScroll: true,
      });
      return;
    }
    const el = document.querySelector(selector);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.focus({ preventScroll: true });
      return;
    }
    const inner = el?.querySelector?.(
      "input, textarea",
    ) as HTMLInputElement | HTMLTextAreaElement | null;
    inner?.focus({ preventScroll: true });
  } catch {
    /* ignore */
  }
}

function appendValidationHint(node: ReactNode): ReactNode {
  return (
    <Fragment>
      {node}
      <br />
      <span
        style={{
          color: "#ef4444",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        * 내용을 입력해야 다음으로 넘어갈 수 있습니다.
      </span>
    </Fragment>
  );
}

type Step1Phase = "cta" | "modal" | "rp";

type SmartTourResume =
  | { kind: "step1"; phase: Step1Phase; index: number }
  | { kind: "step2"; index: number };

type SmartStepStore = Pick<
  ApplyStore,
  | "isAgreed"
  | "isAgreementModalOpen"
  | "applicantName"
  | "applicantPhone"
  | "applicantEmail"
  | "rpNameEn"
  | "rpContact"
  | "productNameEn"
  | "labelFiles"
  | "ingredientText"
  | "aiCategoryQuery"
>;

/** useApplyStore 기준으로 첫 빈 필수 입력에 해당하는 Joyride 스텝 인덱스 계산 */
export function calculateSmartStep(
  pathname: string,
  store: SmartStepStore,
): SmartTourResume {
  const t = (v: string | undefined) => (v ?? "").trim();

  if (pathname === "/apply/step2") {
    if (!t(store.productNameEn)) return { kind: "step2", index: 0 };
    const hasIngredient =
      (store.labelFiles?.length ?? 0) > 0 || t(store.ingredientText).length > 0;
    if (!hasIngredient) return { kind: "step2", index: 1 };
    if (!t(store.aiCategoryQuery)) return { kind: "step2", index: 2 };
    return { kind: "step2", index: 2 };
  }

  if (!store.isAgreed) {
    if (store.isAgreementModalOpen) {
      if (!t(store.applicantName)) return { kind: "step1", phase: "modal", index: 0 };
      if (!t(store.applicantPhone)) return { kind: "step1", phase: "modal", index: 1 };
      if (!t(store.applicantEmail)) return { kind: "step1", phase: "modal", index: 2 };
      return { kind: "step1", phase: "modal", index: 3 };
    }
    return { kind: "step1", phase: "cta", index: 0 };
  }

  if (!t(store.rpNameEn)) return { kind: "step1", phase: "rp", index: 0 };
  if (!t(store.rpContact)) return { kind: "step1", phase: "rp", index: 1 };
  return { kind: "step1", phase: "rp", index: 3 };
}

function readTutorialDone(): boolean {
  return readTutorialDoneFromStorage();
}

function persistTutorialDone() {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    sessionStorage.removeItem(CONTINUE_SESSION_KEY);
    dispatchTutorialCompleted();
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
    "실제 화면의 「서비스 대행 동의서 보기 및 정보 입력(필수)」 버튼을 직접 클릭해 주세요.",
  placement: "bottom",
  styles: { buttonPrimary: { display: "none" } },
};

const step1ModalSteps: Step[] = [
  {
    target: "#tour-step-1-company",
    title: "1-1 · 신청 기업명",
    content: "Mocra 등록을 신청하시는 기업명을 한글로 입력해주세요",
    placement: "bottom",
  },
  {
    target: "#tour-step-1-contact",
    title: "1-2 · 기업 연락처",
    content: "위 기업의 연락처를 입력해 주세요.",
    placement: "bottom",
  },
  {
    target: "#tour-step-1-email",
    title: "1-3 · 담당자 이메일",
    content: "해당 기업의 이메일 주소를 입력해 주세요.",
    placement: "bottom",
  },
  {
    target: "#tour-step-1-submit",
    title: "1-4 · 동의",
    content:
      "실제 화면의 「위 내용에 동의하고 적용하기」 버튼을 직접 클릭해 주세요.",
    placement: "top",
    styles: { buttonPrimary: { display: "none" } },
  },
];

/** 모달 이후 1단계 메인 폼 (RP · 추천인 · 다음) */
const step1MainSteps: Step[] = [
  {
    target: "#tour-step-rp-name",
    title: "2 · RP 영문 기업명",
    content:
      "미국 수출 영문 라벨에 적힌 Responsible Person(판매 책임 기업)의 정확한 영문 명칭을 입력해 주세요.",
    placement: "bottom",
  },
  {
    target: "#tour-step-rp-contact",
    title: "3 · RP 연락처",
    content: "영문 라벨에 표기할 RP 연락처를 입력해 주세요.",
    placement: "bottom",
  },
  {
    target: "#tour-step-recommender",
    title: "4 · 추천인 (선택)",
    content:
      "영업 담당자 추천인 이름을 적으면 할인 혜택이 적용됩니다. 없으면 비워 두셔도 됩니다.",
    placement: "bottom",
  },
  {
    target: "#tour-step-next-btn",
    title: "5 · 다음 단계",
    content:
      "실제 화면의 「저장하고 다음 단계로」 버튼을 직접 클릭해 주세요.",
    placement: "top",
    styles: { buttonPrimary: { display: "none" } },
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
  tooltipFooter: {
    marginTop: 14,
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
    marginTop: 4,
    border: "1px solid #d1d5db",
    borderRadius: 4,
    padding: "6px 12px",
    fontSize: 13,
    color: "#4b5563",
    backgroundColor: "#f9fafb",
    fontWeight: 600,
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
  /** 배경 클릭으로 스텝이 닫히지 않도록 (구 API disableOverlayClose와 동등) */
  overlayClickAction: false,
  /** Esc로 닫히지 않도록 (구 API disableCloseOnEsc와 동등) */
  dismissKeyAction: false,
  /** 툴팁/다음 버튼으로 포커스를 가져가지 않음 (v3: 구 disableAutoFocus에 해당) */
  disableFocusTrap: true,
  /** 타겟으로 스크롤 유지 (v3: skipScroll === false) */
  skipScroll: false,
};

function initialStep1Phase(): Step1Phase {
  if (typeof window === "undefined") return "cta";
  if (readTutorialDone()) return "cta";
  return useApplyStore.getState().isAgreed ? "rp" : "cta";
}

export function ApplyOnboardingTour() {
  const pathname = usePathname();
  const isAgreementModalOpen = useApplyStore((s) => s.isAgreementModalOpen);
  const isAgreed = useApplyStore((s) => s.isAgreed);

  const [mounted, setMounted] = useState(false);
  const [tutorialDone, setTutorialDone] = useState(true);
  const [run, setRun] = useState(false);
  const [step1Phase, setStep1Phase] = useState<Step1Phase>(initialStep1Phase);
  const [pendingRpAfterModal, setPendingRpAfterModal] = useState(false);
  const [joyrideCycle, setJoyrideCycle] = useState(0);
  const [joyrideStartIndex, setJoyrideStartIndex] = useState(0);
  const [inputGuardErrorIndex, setInputGuardErrorIndex] = useState<number | null>(
    null,
  );

  const step1PhaseRef = useRef(step1Phase);
  step1PhaseRef.current = step1Phase;

  const joyrideControlsRef = useRef<Controls | null>(null);

  useEffect(() => {
    setMounted(true);
    setTutorialDone(readTutorialDone());
  }, []);

  const steps = useMemo(() => {
    const wrap = (list: Step[]) =>
      list.map((step, i) => {
        const sel = typeof step.target === "string" ? step.target : "";
        const showHint =
          inputGuardErrorIndex === i &&
          sel !== "" &&
          INPUT_GUARD_TARGETS.has(sel);
        return {
          ...step,
          content: showHint ? appendValidationHint(step.content) : step.content,
        };
      });

    if (pathname === "/apply/step1") {
      if (step1Phase === "cta") return wrap([step1CtaStep]);
      if (step1Phase === "modal") return wrap(step1ModalSteps);
      return wrap(step1MainSteps);
    }
    if (pathname === "/apply/step2") return wrap(stepsPart2);
    return [];
  }, [pathname, step1Phase, inputGuardErrorIndex]);

  const joyrideLocale = useMemo(
    () => ({
      back: "이전",
      close: "닫기",
      last:
        pathname === "/apply/step1" && step1Phase === "modal"
          ? "적용하기"
          : "입력하기",
      next: "다음",
      skip: "튜토리얼 종료",
    }),
    [pathname, step1Phase],
  );

  const runRef = useRef(run);
  const stepsRef = useRef(steps);
  runRef.current = run;
  stepsRef.current = steps;

  useEffect(() => {
    if (!run || steps.length === 0) return;

    const pendingFocusTimeouts: number[] = [];

    const resolveTargetEl = (target: Step["target"]): HTMLElement | null => {
      if (typeof target === "string") {
        try {
          return document.querySelector(target) as HTMLElement | null;
        } catch {
          return null;
        }
      }
      if (typeof target === "function") {
        return target() ?? null;
      }
      if (target && typeof target === "object" && "current" in target) {
        return target.current;
      }
      if (target instanceof HTMLElement) return target;
      return null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" && e.key !== "Enter") return;
      if (!runRef.current) return;

      const controls = joyrideControlsRef.current;
      if (!controls) return;

      let state: ReturnType<Controls["info"]>;
      try {
        state = controls.info();
      } catch {
        return;
      }

      if (
        state.status === STATUS.FINISHED ||
        state.status === STATUS.SKIPPED ||
        state.status === STATUS.IDLE ||
        state.status === STATUS.PAUSED
      ) {
        return;
      }
      if (state.waiting) return;

      const stepList = stepsRef.current;
      const step = stepList[state.index];
      if (!step) return;

      const stepTargetStr =
        typeof step.target === "string" ? step.target : null;
      if (
        stepTargetStr &&
        KEYBOARD_NEXT_EXCLUDED_TARGETS.has(stepTargetStr) &&
        e.key === "Enter"
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (stepTargetStr && KEYBOARD_NEXT_EXCLUDED_TARGETS.has(stepTargetStr)) {
        return;
      }

      const targetEl = resolveTargetEl(step.target);
      if (!targetEl) return;

      const active = document.activeElement;
      if (!active || !(active === targetEl || targetEl.contains(active))) {
        return;
      }

      if (e.key === "Tab" && e.shiftKey) return;
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey || e.altKey)) return;

      if (
        stepTargetStr &&
        INPUT_GUARD_TARGETS.has(stepTargetStr) &&
        !getTourFieldValue(stepTargetStr)
      ) {
        setInputGuardErrorIndex(state.index);
        focusTourTargetForStep(stepTargetStr);
        if (e.key === "Enter") {
          e.preventDefault();
        }
        return;
      }

      if (stepTargetStr && INPUT_GUARD_TARGETS.has(stepTargetStr)) {
        setInputGuardErrorIndex((cur) => (cur === state.index ? null : cur));
      }

      if (e.key === "Enter") {
        e.preventDefault();
      }

      const nextStep = stepList[state.index + 1];
      controls.next(ORIGIN.KEYBOARD);

      if (!nextStep) return;

      const focusDelayMs = 75;
      const tid = window.setTimeout(() => {
        const nextEl = resolveTargetEl(nextStep.target);
        nextEl?.focus({ preventScroll: true });
      }, focusDelayMs);
      pendingFocusTimeouts.push(tid as number);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      for (const tid of pendingFocusTimeouts) {
        window.clearTimeout(tid);
      }
    };
  }, [run, steps.length]);

  /** 이미 동의(신청자 정보 저장)까지 끝난 경우 CTA를 건너뛰고 메인 폼 투어부터 */
  useEffect(() => {
    if (
      !mounted ||
      tutorialDone ||
      pathname !== "/apply/step1" ||
      readContinueFlag()
    ) {
      return;
    }
    if (!isAgreed) return;
    setStep1Phase((p) => (p === "cta" ? "rp" : p));
  }, [mounted, tutorialDone, pathname, isAgreed]);

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
    let companyFocusRetryId: number | undefined;
    const delayMs = 200;
    const timerId = window.setTimeout(() => {
      if (cancelled) return;
      setStep1Phase("modal");
      setJoyrideStartIndex(0);
      setJoyrideCycle((c) => c + 1);
      setRun(true);
      document.querySelector<HTMLElement>("#tour-step-1-company")?.focus({
        preventScroll: true,
      });
      companyFocusRetryId = window.setTimeout(() => {
        if (cancelled) return;
        document.querySelector<HTMLElement>("#tour-step-1-company")?.focus({
          preventScroll: true,
        });
      }, 50) as number;
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
      if (companyFocusRetryId !== undefined) {
        window.clearTimeout(companyFocusRetryId);
      }
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
    setJoyrideStartIndex(0);
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

  /**
   * 모달 단계에서 창이 닫힌 경우: 동의 저장 완료면 RP 메인 투어로,
   * 비동의 이탈이면 CTA로 복귀.
   */
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

    if (useApplyStore.getState().isAgreed) {
      setStep1Phase("rp");
      setJoyrideStartIndex(0);
      setJoyrideCycle((c) => c + 1);
      setRun(false);
      const t = window.setTimeout(() => setRun(true), 220);
      return () => window.clearTimeout(t);
    }

    setStep1Phase("cta");
    setJoyrideStartIndex(0);
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

  const handleSmartResume = useCallback(() => {
    try {
      localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setTutorialDone(false);
    setPendingRpAfterModal(false);
    setInputGuardErrorIndex(null);

    if (pathname === "/apply/step2") {
      setContinueFlag();
    }

    const smart = calculateSmartStep(pathname, useApplyStore.getState());
    if (smart.kind === "step1") {
      setStep1Phase(smart.phase);
    }
    setJoyrideStartIndex(smart.index);

    setRun(false);
    setJoyrideCycle((c) => c + 1);
    window.setTimeout(() => setRun(true), 120);
    dispatchTutorialRestarted();
  }, [pathname]);

  useEffect(() => {
    const onResume = () => {
      handleSmartResume();
    };
    window.addEventListener(APPLY_TUTORIAL_RESUME_EVENT, onResume);
    return () => {
      window.removeEventListener(APPLY_TUTORIAL_RESUME_EVENT, onResume);
    };
  }, [handleSmartResume]);

  const GuardedTooltip = useMemo(() => {
    return function ApplyJoyrideTooltip(props: TooltipRenderProps) {
      const {
        backProps,
        closeProps,
        primaryProps,
        skipProps,
        step,
        tooltipProps,
        index,
        isLastStep,
      } = props;
      const { buttons, content, styles: stepStyles, title } = step;
      const primaryChildren = (primaryProps as { children?: ReactNode })
        .children;
      const primaryOnClick = primaryProps.onClick;
      const hasFooter = buttons.some(
        (b) => b === "back" || b === "primary" || b === "skip",
      );
      return (
        <div
          key="JoyrideTooltip"
          className="react-joyride__tooltip"
          data-joyride-step={index}
          {...(step.id ? { "data-joyride-id": step.id } : {})}
          style={stepStyles.tooltip}
          {...tooltipProps}
        >
          <div style={stepStyles.tooltipContainer}>
            {title ? (
              <h4 id="joyride-tooltip-title" style={stepStyles.tooltipTitle}>
                {title}
              </h4>
            ) : null}
            <div
              id="joyride-tooltip-content"
              style={stepStyles.tooltipContent}
            >
              {content}
            </div>
          </div>
          {hasFooter ? (
            <div style={stepStyles.tooltipFooter}>
              <div style={stepStyles.tooltipFooterSpacer}>
                {buttons.includes("skip") && !isLastStep ? (
                  <button
                    type="button"
                    style={stepStyles.buttonSkip}
                    {...skipProps}
                  />
                ) : null}
              </div>
              {buttons.includes("back") && index > 0 ? (
                <button
                  type="button"
                  style={stepStyles.buttonBack}
                  {...backProps}
                />
              ) : null}
              {buttons.includes("primary") ? (
                <button
                  type="button"
                  style={stepStyles.buttonPrimary}
                  aria-label={primaryProps["aria-label"]}
                  data-action={primaryProps["data-action"]}
                  role={primaryProps.role}
                  title={primaryProps.title}
                  onClick={(e: MouseEvent<HTMLElement>) => {
                    e.preventDefault();
                    const sel = typeof step.target === "string" ? step.target : "";
                    if (INPUT_GUARD_TARGETS.has(sel)) {
                      if (!getTourFieldValue(sel)) {
                        setInputGuardErrorIndex(index);
                        focusTourTargetForStep(sel);
                        return;
                      }
                      setInputGuardErrorIndex((cur) =>
                        cur === index ? null : cur,
                      );
                    }
                    primaryOnClick(e);
                  }}
                >
                  {primaryChildren}
                </button>
              ) : null}
            </div>
          ) : null}
          {buttons.includes("close") ? (
            <button type="button" style={stepStyles.buttonClose} {...closeProps} />
          ) : null}
        </div>
      );
    };
  }, []);

  const onEvent = useCallback<EventHandler>(
    (data, controls) => {
      joyrideControlsRef.current = controls;
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
            setJoyrideStartIndex(0);
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
            setJoyrideStartIndex(0);
            setJoyrideCycle((c) => c + 1);
            window.setTimeout(() => setRun(true), 200);
          }
          return;
        }

        if (phase === "rp") {
          setRun(false);
          setContinueFlag();
        }
        return;
      }

      if (pathname === "/apply/step2") {
        persistTutorialDone();
        setTutorialDone(true);
        setRun(false);
      }
    },
    [pathname],
  );

  if (!mounted || tutorialDone || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      key={`${pathname}-${step1Phase}-${joyrideCycle}-${steps.length}-${joyrideStartIndex}`}
      run={run}
      steps={steps}
      continuous
      scrollToFirstStep
      initialStepIndex={joyrideStartIndex}
      locale={joyrideLocale}
      styles={joyrideStyles}
      options={{ ...joyrideOptionsAboveModal }}
      tooltipComponent={GuardedTooltip}
      onEvent={onEvent}
    />
  );
}
