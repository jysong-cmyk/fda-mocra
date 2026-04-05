import {
  RP_PRODUCT_NAME_REGEX,
  type AiRecommendation,
  type CartLine,
  type CommonRequiredKey,
  type ProductFieldKey,
} from "@/lib/apply/types-and-constants";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ApplyStore = {
  isAgreed: boolean;
  rpNameEn: string;
  rpContact: string;
  agentName: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  rpNameEnError: boolean;
  rpContactError: boolean;
  nameError: string;
  phoneError: string;
  emailError: string;
  isAgreementModalOpen: boolean;

  productNameEn: string;
  category1: string;
  category2: string;
  category3: string;
  feiNumber: string;
  feiError: string;
  labelFiles: File[];
  ingredientFileMeta: { name: string; size: number; type: string } | null;
  ocrProcessing: boolean;
  ingredientText: string;
  showIngredientTextarea: boolean;
  isIngredientConfirmed: boolean;
  aiCategoryQuery: string;
  aiRecommendation: AiRecommendation | null;
  aiSearchLoading: boolean;
  aiCategoryQueryError: boolean;
  productNameEnError: boolean;

  cartLines: CartLine[];
  editingId: string | null;
  isAddingProduct: boolean;

  commonRequiredError: Partial<Record<CommonRequiredKey, boolean>>;
  productFieldError: Partial<Record<ProductFieldKey, boolean>>;

  setIsAgreed: (v: boolean) => void;
  setRpNameEn: (v: string) => void;
  setRpContact: (v: string) => void;
  setAgentName: (v: string) => void;
  setApplicantName: (v: string) => void;
  setApplicantPhone: (v: string) => void;
  setApplicantEmail: (v: string) => void;
  setRpNameEnError: (v: boolean) => void;
  setRpContactError: (v: boolean) => void;
  setNameError: (v: string) => void;
  setPhoneError: (v: string) => void;
  setEmailError: (v: string) => void;
  setAgreementModalOpen: (v: boolean) => void;

  setProductNameEn: (v: string) => void;
  setCategory1: (v: string) => void;
  setCategory2: (v: string) => void;
  setCategory3: (v: string) => void;
  setFeiNumber: (v: string) => void;
  setFeiError: (v: string) => void;
  setLabelFiles: (v: File[] | ((prev: File[]) => File[])) => void;
  setIngredientFileMeta: (
    v: { name: string; size: number; type: string } | null,
  ) => void;
  setOcrProcessing: (v: boolean) => void;
  setIngredientText: (v: string) => void;
  setShowIngredientTextarea: (v: boolean) => void;
  setIsIngredientConfirmed: (v: boolean) => void;
  setAiCategoryQuery: (v: string) => void;
  setAiRecommendation: (v: AiRecommendation | null) => void;
  setAiSearchLoading: (v: boolean) => void;
  setAiCategoryQueryError: (v: boolean) => void;
  setProductNameEnError: (v: boolean) => void;

  setCartLines: (v: CartLine[] | ((prev: CartLine[]) => CartLine[])) => void;
  setEditingId: (v: string | null) => void;
  setIsAddingProduct: (v: boolean) => void;
  setCommonRequiredError: (
    v:
      | Partial<Record<CommonRequiredKey, boolean>>
      | ((
          p: Partial<Record<CommonRequiredKey, boolean>>,
        ) => Partial<Record<CommonRequiredKey, boolean>>),
  ) => void;
  setProductFieldError: (
    v:
      | Partial<Record<ProductFieldKey, boolean>>
      | ((
          p: Partial<Record<ProductFieldKey, boolean>>,
        ) => Partial<Record<ProductFieldKey, boolean>>),
  ) => void;

  clearProductFieldKey: (key: ProductFieldKey) => void;
  clearCommonRequiredKey: (key: CommonRequiredKey) => void;
  clearProductZoneB: () => void;
  fillProductFormFromLine: (line: CartLine) => void;
  /** 목록에서 수정 진입 시 RP·신청자 등 공통 필드 동기화 */
  hydrateCommonFromCartLine: (line: CartLine) => void;
  resetApplyWizard: () => void;
};

/** persist에 넣는 직렬화 가능한 조각(File 제외) */
export type ApplyPersistedState = {
  isAgreed: boolean;
  rpNameEn: string;
  rpContact: string;
  agentName: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  rpNameEnError: boolean;
  rpContactError: boolean;
  nameError: string;
  phoneError: string;
  emailError: string;
  productNameEn: string;
  category1: string;
  category2: string;
  category3: string;
  feiNumber: string;
  feiError: string;
  ingredientFileMeta: { name: string; size: number; type: string } | null;
  ingredientText: string;
  showIngredientTextarea: boolean;
  isIngredientConfirmed: boolean;
  aiCategoryQuery: string;
  aiRecommendation: AiRecommendation | null;
  aiCategoryQueryError: boolean;
  productNameEnError: boolean;
  cartLines: CartLine[];
  editingId: string | null;
  commonRequiredError: Partial<Record<CommonRequiredKey, boolean>>;
  productFieldError: Partial<Record<ProductFieldKey, boolean>>;
};

const initialProductDraft = {
  productNameEn: "",
  category1: "",
  category2: "",
  category3: "",
  feiNumber: "",
  feiError: "",
  labelFiles: [] as File[],
  ingredientFileMeta: null as { name: string; size: number; type: string } | null,
  ocrProcessing: false,
  ingredientText: "",
  showIngredientTextarea: false,
  isIngredientConfirmed: false,
  aiCategoryQuery: "",
  aiRecommendation: null as AiRecommendation | null,
  aiSearchLoading: false,
  aiCategoryQueryError: false,
  productNameEnError: false,
};

const initialCommon = {
  isAgreed: false,
  rpNameEn: "",
  rpContact: "",
  agentName: "",
  applicantName: "",
  applicantPhone: "",
  applicantEmail: "",
  rpNameEnError: false,
  rpContactError: false,
  nameError: "",
  phoneError: "",
  emailError: "",
  isAgreementModalOpen: false,
};

export const useApplyStore = create<ApplyStore>()(
  persist(
    (set) => ({
  ...initialCommon,
  ...initialProductDraft,
  cartLines: [],
  editingId: null,
  isAddingProduct: false,
  commonRequiredError: {},
  productFieldError: {},

  setIsAgreed: (v) => set({ isAgreed: v }),
  setRpNameEn: (v) => set({ rpNameEn: v }),
  setRpContact: (v) => set({ rpContact: v }),
  setAgentName: (v) => set({ agentName: v }),
  setApplicantName: (v) => set({ applicantName: v }),
  setApplicantPhone: (v) => set({ applicantPhone: v }),
  setApplicantEmail: (v) => set({ applicantEmail: v }),
  setRpNameEnError: (v) => set({ rpNameEnError: v }),
  setRpContactError: (v) => set({ rpContactError: v }),
  setNameError: (v) => set({ nameError: v }),
  setPhoneError: (v) => set({ phoneError: v }),
  setEmailError: (v) => set({ emailError: v }),
  setAgreementModalOpen: (v) => set({ isAgreementModalOpen: v }),

  setProductNameEn: (v) => set({ productNameEn: v }),
  setCategory1: (v) => set({ category1: v, category2: "", category3: "" }),
  setCategory2: (v) => set({ category2: v, category3: "" }),
  setCategory3: (v) => set({ category3: v }),
  setFeiNumber: (v) => set({ feiNumber: v }),
  setFeiError: (v) => set({ feiError: v }),
  setLabelFiles: (v) =>
    set((s) => ({
      labelFiles: typeof v === "function" ? v(s.labelFiles) : v,
    })),
  setIngredientFileMeta: (v) => set({ ingredientFileMeta: v }),
  setOcrProcessing: (v) => set({ ocrProcessing: v }),
  setIngredientText: (v) => set({ ingredientText: v }),
  setShowIngredientTextarea: (v) => set({ showIngredientTextarea: v }),
  setIsIngredientConfirmed: (v) => set({ isIngredientConfirmed: v }),
  setAiCategoryQuery: (v) => set({ aiCategoryQuery: v }),
  setAiRecommendation: (v) => set({ aiRecommendation: v }),
  setAiSearchLoading: (v) => set({ aiSearchLoading: v }),
  setAiCategoryQueryError: (v) => set({ aiCategoryQueryError: v }),
  setProductNameEnError: (v) => set({ productNameEnError: v }),

  setCartLines: (v) =>
    set((s) => ({
      cartLines: typeof v === "function" ? v(s.cartLines) : v,
    })),
  setEditingId: (v) => set({ editingId: v }),
  setIsAddingProduct: (v) => set({ isAddingProduct: v }),
  setCommonRequiredError: (v) =>
    set((s) => ({
      commonRequiredError:
        typeof v === "function" ? v(s.commonRequiredError) : v,
    })),
  setProductFieldError: (v) =>
    set((s) => ({
      productFieldError: typeof v === "function" ? v(s.productFieldError) : v,
    })),

  clearProductFieldKey: (key) =>
    set((s) => {
      if (s.productFieldError[key] !== true) return s;
      const next = { ...s.productFieldError };
      delete next[key];
      return { productFieldError: next };
    }),

  clearCommonRequiredKey: (key) =>
    set((s) => {
      if (s.commonRequiredError[key] !== true) return s;
      const next = { ...s.commonRequiredError };
      delete next[key];
      return { commonRequiredError: next };
    }),

  clearProductZoneB: () =>
    set({
      ...initialProductDraft,
      editingId: null,
      productFieldError: {},
    }),

  hydrateCommonFromCartLine: (line) => {
    const rpN = line.rpNameEn ?? "";
    const rpC = line.rpContact ?? "";
    set({
      rpNameEn: rpN,
      rpContact: rpC,
      rpNameEnError:
        rpN.length > 0 && !RP_PRODUCT_NAME_REGEX.test(rpN),
      rpContactError:
        rpC.length > 0 && rpC.replace(/[^0-9-+]/g, "") !== rpC,
      agentName: line.agentName ?? "",
      applicantName: line.applicantName ?? "",
      applicantPhone: line.applicantPhone ?? "",
      applicantEmail: line.applicantEmail ?? "",
      nameError: "",
      phoneError: "",
      emailError: "",
      isAgreed: true,
      commonRequiredError: {},
    });
  },

  fillProductFormFromLine: (line) =>
    set({
      productNameEn: line.productNameEn,
      category1: line.category1,
      category2: line.category2,
      category3: line.category3,
      feiNumber: line.feiNumber,
      feiError: "",
      ingredientText: line.ingredientText,
      showIngredientTextarea: true,
      isIngredientConfirmed: true,
      ingredientFileMeta: null,
      labelFiles: [],
      aiCategoryQuery: "",
      aiRecommendation: null,
      aiCategoryQueryError: false,
      productNameEnError:
        line.productNameEn.length > 0 &&
        !RP_PRODUCT_NAME_REGEX.test(line.productNameEn),
      ocrProcessing: false,
      productFieldError: {},
    }),

  resetApplyWizard: () =>
    set({
      ...initialCommon,
      ...initialProductDraft,
      cartLines: [],
      editingId: null,
      isAddingProduct: false,
      commonRequiredError: {},
      productFieldError: {},
    }),
}),
    {
      name: "aicra-apply",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state): ApplyPersistedState => ({
        isAgreed: state.isAgreed,
        rpNameEn: state.rpNameEn,
        rpContact: state.rpContact,
        agentName: state.agentName,
        applicantName: state.applicantName,
        applicantPhone: state.applicantPhone,
        applicantEmail: state.applicantEmail,
        rpNameEnError: state.rpNameEnError,
        rpContactError: state.rpContactError,
        nameError: state.nameError,
        phoneError: state.phoneError,
        emailError: state.emailError,
        productNameEn: state.productNameEn,
        category1: state.category1,
        category2: state.category2,
        category3: state.category3,
        feiNumber: state.feiNumber,
        feiError: state.feiError,
        ingredientFileMeta: state.ingredientFileMeta,
        ingredientText: state.ingredientText,
        showIngredientTextarea: state.showIngredientTextarea,
        isIngredientConfirmed: state.isIngredientConfirmed,
        aiCategoryQuery: state.aiCategoryQuery,
        aiRecommendation: state.aiRecommendation,
        aiCategoryQueryError: state.aiCategoryQueryError,
        productNameEnError: state.productNameEnError,
        cartLines: state.cartLines,
        editingId: state.editingId,
        commonRequiredError: state.commonRequiredError,
        productFieldError: state.productFieldError,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<ApplyPersistedState> | undefined;
        return {
          ...current,
          ...p,
          labelFiles: [],
          ocrProcessing: false,
          aiSearchLoading: false,
          isAddingProduct: false,
          isAgreementModalOpen: false,
        };
      },
    },
  ),
);
