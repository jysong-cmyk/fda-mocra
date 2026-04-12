"use client";

import { AgreementModal } from "@/components/apply/agreement-modal";
import { ApplyFooter } from "@/components/apply/apply-footer";
import { ApplyStepper } from "@/components/apply/apply-stepper";
import { ApplyFieldLabel } from "@/components/apply/field-label";
import { RegisterAiTrustStrip } from "@/components/apply/register-ai-trust-strip";
import { AicraHeader } from "@/components/aicra-header";
import {
  INTERNATIONAL_PHONE_BLUR_ALERT,
  isApplicantEmailFormatValid,
  isApplicantPhoneFormatValid,
  isInternationalPhoneFormatValid,
} from "@/lib/apply/applicant-contact-validation";
import type { CommonRequiredKey } from "@/lib/apply/types-and-constants";
import { useApplyStore } from "@/stores/apply-store";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ApplyCardHeader, ApplyShell } from "../apply-shell";

const kb = "break-keep text-balance" as const;

export function Step1Client() {
  const [rpPhoneBlurHint, setRpPhoneBlurHint] = useState<string | null>(null);
  const router = useRouter();
  const isAgreed = useApplyStore((s) => s.isAgreed);
  const setAgreementModalOpen = useApplyStore((s) => s.setAgreementModalOpen);
  const clearCommonRequiredKey = useApplyStore((s) => s.clearCommonRequiredKey);
  const commonRequiredError = useApplyStore((s) => s.commonRequiredError);
  const setCommonRequiredError = useApplyStore((s) => s.setCommonRequiredError);

  const rpNameEn = useApplyStore((s) => s.rpNameEn);
  const rpContact = useApplyStore((s) => s.rpContact);
  const agentName = useApplyStore((s) => s.agentName);
  const applicantName = useApplyStore((s) => s.applicantName);
  const applicantPhone = useApplyStore((s) => s.applicantPhone);
  const applicantEmail = useApplyStore((s) => s.applicantEmail);
  const setRpNameEn = useApplyStore((s) => s.setRpNameEn);
  const setRpContact = useApplyStore((s) => s.setRpContact);
  const setAgentName = useApplyStore((s) => s.setAgentName);
  const rpNameEnError = useApplyStore((s) => s.rpNameEnError);
  const rpContactError = useApplyStore((s) => s.rpContactError);
  const setRpNameEnError = useApplyStore((s) => s.setRpNameEnError);
  const setRpContactError = useApplyStore((s) => s.setRpContactError);

  const applicantSummaryError =
    commonRequiredError.applicantName === true ||
    commonRequiredError.applicantPhone === true ||
    commonRequiredError.applicantEmail === true;

  const invalidFieldClass =
    "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200";
  const normalFieldClass =
    "border-zinc-200 ring-zinc-400 focus:border-zinc-300 focus:ring-2";

  const handleNext = useCallback(() => {
    const st = useApplyStore.getState();

    const err: Partial<Record<CommonRequiredKey, boolean>> = {};
    if (!st.isAgreed) err.agreement = true;
    if (st.rpNameEn.trim() === "") err.rpNameEn = true;
    if (st.rpContact.trim() === "") err.rpContact = true;
    if (st.applicantName.trim() === "") err.applicantName = true;
    if (st.applicantPhone.trim() === "") err.applicantPhone = true;
    if (st.applicantEmail.trim() === "") err.applicantEmail = true;

    if (Object.keys(err).length > 0) {
      setCommonRequiredError(err);
      alert(
        "필수 항목을 모두 완료해 주세요. 동의서·영문 RP·연락처·신청자(기업) 정보가 필요합니다.",
      );
      return;
    }

    // 신청자(동의서): 국내 규칙 / RP 연락처(1단계): 국제 규칙(+) 필수
    if (!isApplicantPhoneFormatValid(st.applicantPhone)) {
      st.setPhoneError(
        "양식에 맞춰 입력해 주세요. (예: 010-1234-5678, 02-123-4567, +82-10-1234-5678)",
      );
      alert("정확한 이메일(또는 전화번호) 양식을 입력해주세요.");
      return;
    }
    if (!isInternationalPhoneFormatValid(st.rpContact)) {
      st.setRpContactError(true);
      alert(INTERNATIONAL_PHONE_BLUR_ALERT);
      return;
    }
    if (!isApplicantEmailFormatValid(st.applicantEmail)) {
      st.setEmailError(
        "양식에 맞춰 입력해 주세요. (예: example@email.com)",
      );
      alert("정확한 이메일(또는 전화번호) 양식을 입력해주세요.");
      return;
    }

    if (st.rpNameEnError || st.rpContactError) {
      alert(
        "입력 형식에 오류가 있는 항목이 있습니다. 빨간색 안내 문구를 확인해 주세요.",
      );
      return;
    }
    if (
      st.nameError !== "" ||
      st.phoneError !== "" ||
      st.emailError !== ""
    ) {
      alert("신청자 정보 입력 형식을 확인해 주세요.");
      return;
    }
    setCommonRequiredError({});
    router.push("/apply/step2");
  }, [setCommonRequiredError, router]);

  return (
    <ApplyShell>
      <AicraHeader page="register" />
      <div className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-lg shadow-emerald-950/5 ring-1 ring-amber-200/50">
          <ApplyCardHeader />
          <div className="p-6 sm:p-8">
            <ApplyStepper activeStep={1} />
            <RegisterAiTrustStrip />
            <p className="mb-1 font-semibold text-red-500">
              OTC(썬크림, 기능성 화장품), 의료기기는 등록이 불가합니다.
            </p>
            <p className="mb-2 text-gray-600">
              1단계: 기업·시설 공통 정보를 입력한 뒤 다음 단계로 이동합니다.
            </p>

            <section className="mt-8 space-y-5 rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
              <div
                className={`rounded-lg border border-emerald-950/10 bg-stone-100/50 px-4 py-3.5 sm:px-5 sm:py-4 ${kb}`}
              >
                <h2 className="text-base font-bold text-emerald-900 sm:text-lg">
                  공통 정보
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-emerald-900/90">
                  RP 및 신청자 정보는 이후 제품 단계에서 모든 SKU에 동일하게
                  적용됩니다.
                </p>
              </div>

              <div
                className={`tour-step-1 rounded-lg border border-gray-200 bg-white/80 p-4 ${
                  commonRequiredError.agreement === true
                    ? "ring-2 ring-red-400 ring-offset-2"
                    : ""
                }`}
              >
                <p
                  className={`mb-3 text-sm leading-relaxed text-emerald-900/90 ${kb}`}
                >
                  서비스 대행 동의 및 신청자 정보를 입력해 주세요.
                </p>
                {!isAgreed ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearCommonRequiredKey("agreement");
                      setAgreementModalOpen(true);
                    }}
                    className="cursor-pointer rounded-lg bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-stone-50 transition-colors hover:bg-emerald-900"
                  >
                    서비스 대행 동의서 보기 및 정보 입력(필수)
                  </button>
                ) : (
                  <div
                    className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
                      applicantSummaryError
                        ? "rounded-lg ring-2 ring-red-400 ring-offset-1"
                        : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">
                        동의 및 신청자 정보 입력 완료
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {applicantName} · {applicantPhone} · {applicantEmail}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAgreementModalOpen(true)}
                      className="cursor-pointer shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      수정하기
                    </button>
                  </div>
                )}
              </div>

              <div>
                <ApplyFieldLabel
                  htmlFor="tour-step-rp-name"
                  tooltip="미국 수출용 제품의 영문 라벨에 기재된 판매 책임 회사(RP)의 정확한 영문 명칭을 입력해 주세요."
                >
                  영문 라벨 상 판매 기업명 (Responsible Person)
                </ApplyFieldLabel>
                <input
                  id="tour-step-rp-name"
                  type="text"
                  autoComplete="name"
                  value={rpNameEn}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const sanitized = raw.replace(/[^a-zA-Z0-9\s.,&()-]/g, "");
                    setRpNameEnError(raw !== sanitized);
                    setRpNameEn(sanitized);
                    clearCommonRequiredKey("rpNameEn");
                  }}
                  onBlur={(e) => {
                    const el = e.currentTarget;
                    if (el.value.trim() === "") return;
                    if (useApplyStore.getState().rpNameEnError) {
                      window.setTimeout(() => el.focus(), 0);
                    }
                  }}
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-shadow placeholder:text-zinc-400 ${
                    rpNameEnError || commonRequiredError.rpNameEn === true
                      ? invalidFieldClass
                      : normalFieldClass
                  }`}
                  placeholder="예: Beauty Cosmetics Inc."
                />
                {rpNameEnError ? (
                  <p className="mt-1 text-sm text-red-500">
                    영문, 숫자 및 일부 특수문자(.,&()-)만 입력 가능합니다.
                  </p>
                ) : null}
              </div>

              <div>
                <ApplyFieldLabel
                  htmlFor="tour-step-rp-contact"
                  tooltip="영문 라벨 상 판매 기업(RP)의 연락처를 입력해 주세요."
                >
                  영문 라벨 상 판매 기업 연락처 (Responsible Person 연락처)
                </ApplyFieldLabel>
                <input
                  id="tour-step-rp-contact"
                  type="text"
                  autoComplete="tel"
                  value={rpContact}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const sanitized = raw.replace(/[^0-9+.\- ]/g, "");
                    setRpContactError(raw !== sanitized);
                    setRpContact(sanitized);
                    setRpPhoneBlurHint(null);
                    clearCommonRequiredKey("rpContact");
                  }}
                  onBlur={(e) => {
                    const el = e.currentTarget;
                    if (el.value.trim() === "") {
                      setRpPhoneBlurHint(null);
                      return;
                    }
                    if (!isInternationalPhoneFormatValid(el.value)) {
                      setRpPhoneBlurHint(INTERNATIONAL_PHONE_BLUR_ALERT);
                      window.setTimeout(() => el.focus(), 0);
                    } else {
                      setRpPhoneBlurHint(null);
                    }
                  }}
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-shadow placeholder:text-zinc-400 ${
                    rpContactError ||
                    rpPhoneBlurHint != null ||
                    commonRequiredError.rpContact === true
                      ? invalidFieldClass
                      : normalFieldClass
                  }`}
                  placeholder="+82-10-1234-5678 (국가번호 '+' 필수)"
                />
                {rpPhoneBlurHint != null ? (
                  <p className="mt-1 text-sm text-red-500">{rpPhoneBlurHint}</p>
                ) : rpContactError ? (
                  <p className="mt-1 text-sm text-red-500">
                    숫자, 하이픈(-), 플러스(+), 공백, 점(.)만 입력 가능합니다.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-zinc-600">
                    (국가번호 &apos;+&apos; 필수 포함, 예: +82-10-1234-5678)
                  </p>
                )}
              </div>

              <div>
                <ApplyFieldLabel
                  htmlFor="tour-step-recommender"
                  tooltip="이 웹사이트를 소개해준 당사 영업 담당자 이름을 한글로 입력해 주세요."
                >
                  추천인(영업 담당자) 이름 (선택 사항)
                </ApplyFieldLabel>
                <input
                  id="tour-step-recommender"
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-400 transition-shadow placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2"
                  placeholder="예: 홍길동 (한글 입력)"
                />
                <p className="mt-2 text-sm font-semibold text-emerald-800">
                  추천인 이름을 입력하시면 할인 혜택이 적용됩니다.
                </p>
              </div>
            </section>

            <ApplyFooter
              showPrev={false}
              onNext={handleNext}
              nextLabel="저장하고 다음 단계로"
              nextButtonId="tour-step-next-btn"
            />
          </div>
        </div>
      </div>
      <AgreementModal />
    </ApplyShell>
  );
}
