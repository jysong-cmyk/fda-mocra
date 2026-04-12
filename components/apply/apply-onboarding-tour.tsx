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
  INTERNATIONAL_PHONE_BLUR_ALERT,
  isApplicantEmailFormatValid,
  isApplicantPhoneFormatValid,
  isFeiNumberValid,
  isInternationalPhoneFormatValid,
} from "@/lib/apply/applicant-contact-validation";
import { isFdaCategorySelectionComplete } from "@/app/fdaCategories";
import {
  APPLY_TUTORIAL_AI_SEARCH_FINISHED_EVENT,
  APPLY_TUTORIAL_CATEGORY_CONFIRM_NEXT_EVENT,
  APPLY_TUTORIAL_CONTINUE_SESSION_KEY,
  APPLY_TUTORIAL_INGREDIENT_CONFIRMED_EVENT,
  APPLY_TUTORIAL_INGREDIENT_OCR_SUCCESS_EVENT,
  APPLY_TUTORIAL_RESUME_EVENT,
  dispatchTutorialRestarted,
  persistApplyTutorialDone,
  readTutorialDoneFromStorage,
  TUTORIAL_STORAGE_KEY,
} from "@/lib/apply/tutorial-constants";
import { useApplyStore, type ApplyStore } from "@/stores/apply-store";
import { usePathname } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

/** Tab/Enter로 자동 Next 하지 않는 스텝 (v3: overlay/ESC는 overlayClickAction·dismissKeyAction 사용) */
const KEYBOARD_NEXT_EXCLUDED_TARGETS = new Set<string>([
  "#tour-step-next-btn",
  "#tour-step-1-submit",
  "#tutorial-step-ingredient-review-area",
  "#tour-step-2-save",
]);

/** Primary(다음)/Tab·Enter 전 값 검사 대상 (선택 추천인 제외) */
const INPUT_GUARD_TARGETS = new Set<string>([
  "#tour-step-1-company",
  "#tour-step-1-contact",
  "#tour-step-1-email",
  "#tour-step-rp-name",
  "#tour-step-rp-contact",
  "#apply-ai-cat",
  "#tour-step-2-category-review",
  "#apply-fei",
  "#tour-step-2-labels",
  ".tour-step-3",
  ".tour-step-4",
  "#tutorial-step-ingredient-review-area",
]);

type InputGuardKind =
  | "empty"
  | "format-phone"
  | "format-phone-intl"
  | "format-email"
  | "format-fei"
  | "tour-category"
  | "category-not-confirmed"
  | "ingredient-not-confirmed";

function getTourFieldValue(selector: string): string {
  try {
    if (selector === ".tour-step-4") {
      const st = useApplyStore.getState();
      if ((st.ingredientText ?? "").trim() !== "") return "x";
      if (st.ingredientFileMeta != null) return "x";
      const ing = document.querySelector<HTMLInputElement>("#apply-ingredient");
      if (ing?.type === "file" && (ing.files?.length ?? 0) > 0) return "x";
      if (st.editingId != null) {
        const line = st.cartLines.find((c) => c.id === st.editingId);
        if (line && line.ingredientText.trim() !== "") return "x";
      }
      return "";
    }
    if (selector === "#apply-ai-cat") {
      return (useApplyStore.getState().aiCategoryQuery ?? "").trim();
    }
    if (selector === "#tour-step-2-category-review") {
      const st = useApplyStore.getState();
      if (
        !isFdaCategorySelectionComplete(
          st.category1,
          st.category2,
          st.category3,
        )
      ) {
        return "";
      }
      return st.isCategoryConfirmed ? "x" : "";
    }
    if (selector === "#apply-fei") {
      const st = useApplyStore.getState();
      return isFeiNumberValid(st.feiNumber) ? "x" : "";
    }
    if (selector === "#tour-step-2-labels") {
      const st = useApplyStore.getState();
      if ((st.labelFiles?.length ?? 0) > 0) return "x";
      if (st.editingId != null) {
        const line = st.cartLines.find((c) => c.id === st.editingId);
        if (line && line.labelImageUrl.trim() !== "") return "x";
      }
      return "";
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

function evaluateInputGuard(
  selector: string,
): { ok: true } | { ok: false; kind: InputGuardKind } {
  if (selector === "#tour-step-1-contact") {
    const v = getTourFieldValue(selector);
    if (!v) return { ok: false, kind: "empty" };
    if (!isApplicantPhoneFormatValid(v))
      return { ok: false, kind: "format-phone" };
    return { ok: true };
  }
  if (selector === "#tour-step-rp-contact") {
    const v = getTourFieldValue(selector);
    if (!v) return { ok: false, kind: "empty" };
    if (!isInternationalPhoneFormatValid(v))
      return { ok: false, kind: "format-phone-intl" };
    return { ok: true };
  }
  if (selector === "#tour-step-1-email") {
    const v = getTourFieldValue(selector);
    if (!v) return { ok: false, kind: "empty" };
    if (!isApplicantEmailFormatValid(v))
      return { ok: false, kind: "format-email" };
    return { ok: true };
  }
  if (selector === "#apply-ai-cat") {
    if (!getTourFieldValue(selector)) return { ok: false, kind: "empty" };
    return { ok: true };
  }
  if (selector === "#apply-fei") {
    const v = useApplyStore.getState().feiNumber.trim();
    if (!v) return { ok: false, kind: "empty" };
    if (!isFeiNumberValid(v)) return { ok: false, kind: "format-fei" };
    return { ok: true };
  }
  if (selector === "#tour-step-2-category-review") {
    const st = useApplyStore.getState();
    if (
      !isFdaCategorySelectionComplete(
        st.category1,
        st.category2,
        st.category3,
      )
    ) {
      return { ok: false, kind: "tour-category" };
    }
    if (!st.isCategoryConfirmed) {
      return { ok: false, kind: "category-not-confirmed" };
    }
    return { ok: true };
  }
  if (selector === "#tutorial-step-ingredient-review-area") {
    const st = useApplyStore.getState();
    if (!st.isIngredientConfirmed) {
      return { ok: false, kind: "ingredient-not-confirmed" };
    }
    return { ok: true };
  }
  if (!getTourFieldValue(selector)) return { ok: false, kind: "empty" };
  return { ok: true };
}

const TOUR_DEEP_FOCUSABLE =
  "input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])";

/**
 * Joyride 스텝 타겟에 포커스: 타겟이 input/textarea면 직접, 래퍼면 내부 첫 활성 입력에 포커스.
 * (튜토리얼 가드·Tab 로직에서 동기 호출)
 */
function focusTourTargetForStep(selector: string) {
  try {
    const root = document.querySelector(selector);
    if (!root) return;

    if (
      root instanceof HTMLInputElement ||
      root instanceof HTMLTextAreaElement
    ) {
      if (!root.disabled) {
        root.focus({ preventScroll: true });
      }
      return;
    }

    if (root instanceof HTMLButtonElement && !root.disabled) {
      root.focus({ preventScroll: true });
      return;
    }

    if (root instanceof HTMLSelectElement && !root.disabled) {
      root.focus({ preventScroll: true });
      return;
    }

    const inner = root.querySelector<HTMLElement>(TOUR_DEEP_FOCUSABLE);
    if (
      inner instanceof HTMLInputElement ||
      inner instanceof HTMLTextAreaElement ||
      inner instanceof HTMLButtonElement ||
      inner instanceof HTMLSelectElement
    ) {
      if (!inner.disabled) {
        inner.focus({ preventScroll: true });
      }
    }
  } catch {
    /* ignore */
  }
}

/** 툴팁 표시·스텝 전환 직후 DOM이 안정된 뒤 포커스 (Joyride 애니메이션 대비) */
function scheduleFocusTourTargetForStep(selector: string) {
  window.setTimeout(() => {
    focusTourTargetForStep(selector);
  }, 100);
}

function appendValidationHint(
  node: ReactNode,
  kind: InputGuardKind,
): ReactNode {
  const msg =
    kind === "format-phone"
      ? "* 양식에 맞춰 입력해 주세요. (예: 010-1234-5678, 02-123-4567, +82-10-...)"
      : kind === "format-phone-intl"
        ? `* ${INTERNATIONAL_PHONE_BLUR_ALERT}`
      : kind === "format-email"
        ? "* 양식에 맞춰 입력해 주세요. (예: example@email.com)"
        : kind === "format-fei"
          ? "* 제조사 FEI 번호는 숫자 10자리로 입력해 주세요."
          : kind === "tour-category"
            ? "* 카테고리를 검색하여 최종 선택 및 확인해 주세요."
            : kind === "category-not-confirmed"
              ? "* 카테고리를 확인하신 후 [최종 확인] 버튼을 눌러주세요."
              : kind === "ingredient-not-confirmed"
                ? "* 성분 내용을 확인하신 후 [성분표 확인] 버튼을 눌러주세요."
                : "* 내용을 입력해야 다음으로 넘어갈 수 있습니다.";
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
        {msg}
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
  | "category1"
  | "category2"
  | "category3"
  | "feiNumber"
  | "labelFiles"
  | "ingredientText"
  | "ingredientFileMeta"
  | "isIngredientConfirmed"
  | "aiCategoryQuery"
  | "aiRecommendation"
  | "isCategoryConfirmed"
  | "editingId"
  | "cartLines"
>;

/** useApplyStore 기준으로 첫 빈 필수 입력에 해당하는 Joyride 스텝 인덱스 계산 */
export function calculateSmartStep(
  pathname: string,
  store: SmartStepStore,
): SmartTourResume {
  const t = (v: string | undefined) => (v ?? "").trim();

  if (pathname.includes("/apply/step2")) {
    if (!t(store.productNameEn)) return { kind: "step2", index: 0 };
    if (!t(store.aiCategoryQuery)) return { kind: "step2", index: 1 };
    if (store.aiRecommendation != null && !store.isCategoryConfirmed) {
      return { kind: "step2", index: 3 };
    }

    const catsDone = isFdaCategorySelectionComplete(
      store.category1,
      store.category2,
      store.category3,
    );
    const anyCat =
      t(store.category1) !== "" ||
      t(store.category2) !== "" ||
      t(store.category3) !== "";

    if (!catsDone || !store.isCategoryConfirmed) {
      if (!catsDone && !anyCat) {
        return { kind: "step2", index: 2 };
      }
      return { kind: "step2", index: 3 };
    }

    if (!isFeiNumberValid(store.feiNumber.trim())) return { kind: "step2", index: 4 };
    const labelsOk =
      (store.labelFiles?.length ?? 0) > 0 ||
      (store.editingId != null &&
        (store.cartLines.find((c) => c.id === store.editingId)?.labelImageUrl
          .trim() ?? "") !== "");
    if (!labelsOk) return { kind: "step2", index: 5 };
    if (store.editingId == null && store.ingredientFileMeta == null) {
      return { kind: "step2", index: 6 };
    }
    if (!t(store.ingredientText)) {
      return { kind: "step2", index: 6 };
    }
    if (!store.isIngredientConfirmed) {
      return { kind: "step2", index: 7 };
    }
    return { kind: "step2", index: 8 };
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

function setContinueFlag() {
  try {
    sessionStorage.setItem(APPLY_TUTORIAL_CONTINUE_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

function readContinueFlag(): boolean {
  try {
    return sessionStorage.getItem(APPLY_TUTORIAL_CONTINUE_SESSION_KEY) === "1";
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

const step2CategoryNameTourContent = (
  <Fragment>
    세럼, 토너 등 제품 분류명을 입력해 주세요. 입력 후 Enter·Tab 또는「다음」을
    누르면 「검색」버튼 단계로 이동합니다.
  </Fragment>
);

const step2AiSearchButtonTourContent = (
  <Fragment>
    {
      "입력하신 분류명을 바탕으로 카테고리를 찾으려면 '검색' 버튼을 눌러주세요."
    }
  </Fragment>
);

/** stepsPart2: 검색(2)·카테고리 확인(3) 인덱스 — 이벤트로 next 시 사용 */
const STEP2_PART2_AI_SEARCH_INDEX = 2;
const STEP2_PART2_CATEGORY_REVIEW_INDEX = 3;
/** stepsPart2: 성분표 파일 업로드(7/9) — OCR 성공 시 다음 스텝(8/9)으로 진행 */
const STEP2_PART2_INGREDIENT_UPLOAD_INDEX = 6;
/** stepsPart2: 성분 검토(8/9) — [성분표 확인] 후 다음 스텝(9/9)으로 진행 */
const STEP2_PART2_INGREDIENT_REVIEW_INDEX = 7;

const step2CategoryReviewTourContent = (
  <Fragment>
    적용된 대/중/소 분류를 확인해 주세요. 직접 수정도 가능합니다. 이상이 없다면
    아래「카테고리 최종 확인」버튼을 눌러 최종 컨펌해 주세요.
  </Fragment>
);

const stepsPart2: Step[] = [
  {
    target: ".tour-step-3",
    title: "1 / 9",
    content: "화장품 영문 라벨에 있는 제품명과 동일한 명칭을 입력해 주세요.",
    placement: "bottom",
  },
  {
    target: "#apply-ai-cat",
    title: "2 / 9",
    content: step2CategoryNameTourContent,
    placement: "bottom",
  },
  {
    target: "#apply-ai-category-search",
    title: "3 / 9",
    content: step2AiSearchButtonTourContent,
    placement: "bottom",
  },
  {
    target: "#tour-step-2-category-review",
    title: "4 / 9",
    content: step2CategoryReviewTourContent,
    placement: "top",
  },
  {
    target: "#apply-fei",
    title: "5 / 9",
    content:
      "제조시설 FEI 번호(숫자 10자리)를 입력합니다. 제조사에 문의해 확인해 주세요.",
    placement: "bottom",
  },
  {
    target: "#tour-step-2-labels",
    title: "6 / 9",
    content:
      "영문 패키지 또는 라벨 사진을 업로드해 주세요. 앞·뒷면이 모두 잘 보이도록 촬영합니다.",
    placement: "top",
  },
  {
    target: ".tour-step-4",
    title: "7 / 9",
    content:
      "성분표 이미지를 올리면 AI가 성분명을 추출합니다. 추출이 끝나면 다음 단계에서 내용을 확인해 주세요.",
    placement: "top",
  },
  {
    target: "#tutorial-step-ingredient-review-area",
    title: "8 / 9",
    content:
      "AI가 추출한 성분 내용을 확인하고, 오타가 있다면 직접 수정한 뒤 [성분표 확인] 버튼을 꼭 눌러주세요.",
    placement: "top",
    blockTargetInteraction: false,
    // react-joyride v3: 스포트라이트 안 클릭 허용. (v2 이름 호환)
    spotlightClicks: true,
  } as Step,
  {
    target: "#tour-step-2-save",
    title: "9 / 9",
    content:
      "입력을 마친 뒤 실제 화면의 「목록에 추가하기」 또는 「목록에 반영하기」 버튼을 직접 눌러 저장해 주세요.",
    placement: "top",
    styles: { buttonPrimary: { display: "none" } },
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
  buttons: ["back", "primary", "skip"] as ButtonType[],
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
  const [inputGuardIssue, setInputGuardIssue] = useState<{
    index: number;
    kind: InputGuardKind;
  } | null>(null);

  const step1PhaseRef = useRef(step1Phase);
  step1PhaseRef.current = step1Phase;

  const joyrideControlsRef = useRef<Controls | null>(null);
  /** 1↔2단계 전환 감지용 — step2 자동 재개가 매 렌더마다 도는 것을 막음 */
  const tourPathRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setTutorialDone(readTutorialDone());
  }, []);

  const steps = useMemo(() => {
    const wrap = (list: Step[]) =>
      list.map((step, i) => {
        const sel = typeof step.target === "string" ? step.target : "";
        const showHint =
          inputGuardIssue !== null &&
          inputGuardIssue.index === i &&
          sel !== "" &&
          INPUT_GUARD_TARGETS.has(sel);
        return {
          ...step,
          content: showHint
            ? appendValidationHint(step.content, inputGuardIssue.kind)
            : step.content,
        };
      });

    if (pathname.includes("/apply/step1")) {
      if (step1Phase === "cta") return wrap([step1CtaStep]);
      if (step1Phase === "modal") return wrap(step1ModalSteps);
      return wrap(step1MainSteps);
    }
    if (pathname.includes("/apply/step2")) return wrap(stepsPart2);
    return [];
  }, [pathname, step1Phase, inputGuardIssue]);

  const joyrideLocale = useMemo(
    () => ({
      back: "이전",
      last:
        pathname.includes("/apply/step1") && step1Phase === "modal"
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
    if (typeof window === "undefined") return;
    const onAiSearchFinished = () => {
      if (!pathname.includes("/apply/step2") || !runRef.current) return;
      const ctrl = joyrideControlsRef.current;
      if (!ctrl) return;
      try {
        const info = ctrl.info();
        if (
          info.status !== STATUS.RUNNING ||
          info.waiting ||
          info.index !== STEP2_PART2_AI_SEARCH_INDEX
        ) {
          return;
        }
        ctrl.next();
      } catch {
        /* ignore */
      }
    };
    const onCategoryConfirmTourNext = () => {
      if (!pathname.includes("/apply/step2") || !runRef.current) return;
      const ctrl = joyrideControlsRef.current;
      if (!ctrl) return;
      try {
        const info = ctrl.info();
        if (
          info.status !== STATUS.RUNNING ||
          info.waiting ||
          info.index !== STEP2_PART2_CATEGORY_REVIEW_INDEX
        ) {
          return;
        }
        ctrl.next();
      } catch {
        /* ignore */
      }
    };
    const onIngredientOcrSuccessTourNext = () => {
      if (!pathname.includes("/apply/step2") || !runRef.current) return;
      const ctrl = joyrideControlsRef.current;
      if (!ctrl) return;
      try {
        const info = ctrl.info();
        if (
          info.status !== STATUS.RUNNING ||
          info.waiting ||
          info.index !== STEP2_PART2_INGREDIENT_UPLOAD_INDEX
        ) {
          return;
        }
        const st = useApplyStore.getState();
        if (
          st.ingredientText.trim() === "" ||
          st.isIngredientConfirmed
        ) {
          return;
        }
        ctrl.next();
      } catch {
        /* ignore */
      }
    };
    const onIngredientConfirmedTourNext = () => {
      if (!pathname.includes("/apply/step2") || !runRef.current) return;
      const ctrl = joyrideControlsRef.current;
      if (!ctrl) return;
      try {
        const info = ctrl.info();
        if (
          info.status !== STATUS.RUNNING ||
          info.waiting ||
          info.index !== STEP2_PART2_INGREDIENT_REVIEW_INDEX
        ) {
          return;
        }
        ctrl.next();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener(
      APPLY_TUTORIAL_AI_SEARCH_FINISHED_EVENT,
      onAiSearchFinished,
    );
    window.addEventListener(
      APPLY_TUTORIAL_CATEGORY_CONFIRM_NEXT_EVENT,
      onCategoryConfirmTourNext,
    );
    window.addEventListener(
      APPLY_TUTORIAL_INGREDIENT_OCR_SUCCESS_EVENT,
      onIngredientOcrSuccessTourNext,
    );
    window.addEventListener(
      APPLY_TUTORIAL_INGREDIENT_CONFIRMED_EVENT,
      onIngredientConfirmedTourNext,
    );
    return () => {
      window.removeEventListener(
        APPLY_TUTORIAL_AI_SEARCH_FINISHED_EVENT,
        onAiSearchFinished,
      );
      window.removeEventListener(
        APPLY_TUTORIAL_CATEGORY_CONFIRM_NEXT_EVENT,
        onCategoryConfirmTourNext,
      );
      window.removeEventListener(
        APPLY_TUTORIAL_INGREDIENT_OCR_SUCCESS_EVENT,
        onIngredientOcrSuccessTourNext,
      );
      window.removeEventListener(
        APPLY_TUTORIAL_INGREDIENT_CONFIRMED_EVENT,
        onIngredientConfirmedTourNext,
      );
    };
  }, [pathname]);

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

      if (stepTargetStr && INPUT_GUARD_TARGETS.has(stepTargetStr)) {
        const g = evaluateInputGuard(stepTargetStr);
        if (!g.ok) {
          setInputGuardIssue({ index: state.index, kind: g.kind });
          focusTourTargetForStep(stepTargetStr);
          if (e.key === "Enter") {
            e.preventDefault();
          }
          if (e.key === "Tab") {
            e.preventDefault();
            e.stopPropagation();
            const t = e.target;
            const keepFocus =
              t instanceof HTMLElement
                ? t
                : active instanceof HTMLElement
                  ? active
                  : null;
            keepFocus?.focus({ preventScroll: true });
          }
          return;
        }
        setInputGuardIssue((cur) =>
          cur?.index === state.index ? null : cur,
        );
      }

      if (e.key === "Enter") {
        e.preventDefault();
      }

      const nextStep = stepList[state.index + 1];
      controls.next(ORIGIN.KEYBOARD);

      if (!nextStep) return;

      const focusDelayMs = 75;
      const tid = window.setTimeout(() => {
        const nt = nextStep.target;
        if (typeof nt === "string" && nt !== "") {
          focusTourTargetForStep(nt);
        } else {
          const nextEl = resolveTargetEl(nt);
          nextEl?.focus({ preventScroll: true });
        }
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
      !pathname.includes("/apply/step1") ||
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
      !pathname.includes("/apply/step1") ||
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
      !pathname.includes("/apply/step1") ||
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
      !pathname.includes("/apply/step1") ||
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
    if (!mounted || tutorialDone || !pathname.includes("/apply/step1")) {
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

  /**
   * 1단계 마지막에서 /apply/step2로 이동할 때 Joyride가 끊기지 않도록,
   * 튜토리얼 미졸업(localStorage !== "true")이면 step2 대본·스마트 인덱스로 즉시 재개.
   * tutorial_completed 인 경우에는 자동 시작하지 않음.
   */
  useLayoutEffect(() => {
    if (!mounted) return;

    if (!pathname.includes("/apply/step2")) {
      tourPathRef.current = pathname;
      return;
    }

    const prev = tourPathRef.current;

    let storageCompleted = false;
    try {
      storageCompleted =
        localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
    } catch {
      storageCompleted = false;
    }

    if (storageCompleted) {
      tourPathRef.current = pathname;
      setTutorialDone(true);
      setRun(false);
      return;
    }

    setTutorialDone(false);

    const landedOnStep2 =
      prev === null || !prev.includes("/apply/step2");
    if (!landedOnStep2) {
      tourPathRef.current = pathname;
      return;
    }

    const smart = calculateSmartStep(pathname, useApplyStore.getState());
    if (smart.kind !== "step2") {
      tourPathRef.current = pathname;
      return;
    }

    setInputGuardIssue(null);
    setContinueFlag();
    setJoyrideStartIndex(smart.index);
    setRun(false);
    setJoyrideCycle((c) => c + 1);

    let cancelled = false;
    const tid = window.setTimeout(() => {
      if (!cancelled) setRun(true);
    }, 280);

    tourPathRef.current = pathname;

    return () => {
      cancelled = true;
      window.clearTimeout(tid);
      // React Strict Mode(개발): 동일 경로 재마운트 시에도 한 번 더 “진입”으로 인식되도록 복원
      tourPathRef.current = prev;
    };
  }, [mounted, pathname]);

  const handleSmartResume = useCallback(() => {
    try {
      localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setTutorialDone(false);
    setPendingRpAfterModal(false);
    setInputGuardIssue(null);

    if (pathname.includes("/apply/step2")) {
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
        primaryProps,
        skipProps,
        step,
        tooltipProps,
        index,
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
                {buttons.includes("skip") ? (
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
                      const g = evaluateInputGuard(sel);
                      if (!g.ok) {
                        setInputGuardIssue({ index, kind: g.kind });
                        focusTourTargetForStep(sel);
                        return;
                      }
                      setInputGuardIssue((cur) =>
                        cur?.index === index ? null : cur,
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
        </div>
      );
    };
  }, []);

  const onEvent = useCallback<EventHandler>(
    (data, controls) => {
      joyrideControlsRef.current = controls;

      if (
        data.type === EVENTS.TOOLTIP &&
        (pathname.includes("/apply/step1") ||
          pathname.includes("/apply/step2"))
      ) {
        const step = "step" in data ? data.step : undefined;
        const t = step?.target;
        const sel = typeof t === "string" ? t : null;
        if (sel != null && sel !== "") {
          scheduleFocusTourTargetForStep(sel);
        }
      }

      if (data.type !== EVENTS.TOUR_STATUS) return;

      if (data.status === STATUS.SKIPPED) {
        persistApplyTutorialDone();
        setTutorialDone(true);
        setRun(false);
        return;
      }

      if (data.status !== STATUS.FINISHED) return;

      if (pathname.includes("/apply/step1")) {
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

      if (pathname.includes("/apply/step2")) {
        persistApplyTutorialDone();
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
