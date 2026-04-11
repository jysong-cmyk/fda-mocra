"use client";

import {
  isApplicantEmailFormatValid,
  isApplicantPhoneFormatValid,
} from "@/lib/apply/applicant-contact-validation";
import { useApplyStore } from "@/stores/apply-store";
import { useCallback } from "react";

const kb = "break-keep text-balance" as const;

export function AgreementModal() {
  const open = useApplyStore((s) => s.isAgreementModalOpen);
  const setOpen = useApplyStore((s) => s.setAgreementModalOpen);
  const applicantName = useApplyStore((s) => s.applicantName);
  const applicantPhone = useApplyStore((s) => s.applicantPhone);
  const applicantEmail = useApplyStore((s) => s.applicantEmail);
  const setApplicantName = useApplyStore((s) => s.setApplicantName);
  const setApplicantPhone = useApplyStore((s) => s.setApplicantPhone);
  const setApplicantEmail = useApplyStore((s) => s.setApplicantEmail);
  const nameError = useApplyStore((s) => s.nameError);
  const phoneError = useApplyStore((s) => s.phoneError);
  const emailError = useApplyStore((s) => s.emailError);
  const setNameError = useApplyStore((s) => s.setNameError);
  const setPhoneError = useApplyStore((s) => s.setPhoneError);
  const setEmailError = useApplyStore((s) => s.setEmailError);
  const setIsAgreed = useApplyStore((s) => s.setIsAgreed);
  const clearCommonRequiredKey = useApplyStore((s) => s.clearCommonRequiredKey);
  const commonRequiredError = useApplyStore((s) => s.commonRequiredError);
  const setCommonRequiredError = useApplyStore((s) => s.setCommonRequiredError);

  const handleSave = useCallback(() => {
    const name = applicantName.trim();
    const phone = applicantPhone.trim();
    const email = applicantEmail.trim();
    setNameError("");
    setPhoneError("");
    setEmailError("");
    if (!name || !phone || !email) {
      alert("이름, 연락처, 이메일을 모두 입력해 주세요.");
      return;
    }
    if (!isApplicantPhoneFormatValid(phone)) {
      setPhoneError(
        "양식에 맞춰 입력해 주세요. (예: 010-1234-5678, 02-123-4567, +82-10-1234-5678)",
      );
      return;
    }
    if (!isApplicantEmailFormatValid(email)) {
      setEmailError(
        "양식에 맞춰 입력해 주세요. (예: example@email.com)",
      );
      return;
    }
    setApplicantName(name);
    setApplicantPhone(phone);
    setApplicantEmail(email);
    setIsAgreed(true);
    setOpen(false);
    setCommonRequiredError((prev) => {
      const next = { ...prev };
      delete next.agreement;
      delete next.applicantName;
      delete next.applicantPhone;
      delete next.applicantEmail;
      return next;
    });
  }, [
    applicantEmail,
    applicantName,
    applicantPhone,
    setApplicantEmail,
    setApplicantName,
    setApplicantPhone,
    setCommonRequiredError,
    setIsAgreed,
    setOpen,
    setEmailError,
    setNameError,
    setPhoneError,
  ]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agreement-modal-title"
      >
        <h2
          id="agreement-modal-title"
          className="mb-4 text-xl font-bold text-gray-900"
        >
          서비스 대행 동의서
        </h2>

        <div className="mb-6 max-h-[50vh] overflow-y-auto rounded border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-700">
          <h3 className="mb-2 text-base font-bold text-gray-900">
            1. 서비스 내용
          </h3>
          <ul className="mb-4 list-disc space-y-1 pl-5">
            <li>
              본 서비스는 일반 화장품 대상 FDA MoCRA 제품 리스팅 대행
              서비스이며, OTC Drug(기능성) 및 의약품 등록은 제외됩니다.
            </li>
            <li>
              고객사가 제공한 정보를 바탕으로 FDA 시스템 Cosmetics Direct에
              제품 리스팅을 등록합니다.
            </li>
          </ul>

          <h3 className="mb-2 text-base font-bold text-gray-900">
            2. 결과물 안내
          </h3>
          <ul className="mb-4 list-disc space-y-1 pl-5 font-medium text-red-600">
            <li>
              FDA MoCRA 등록은 인증이나 허가가 아닙니다. 따라서 인증서,
              등록증, 라이선스 형태의 별도 결과물은 발급되지 않습니다.
            </li>
            <li className="font-normal text-gray-700">
              등록 완료 후에는 제공해주신 이메일로 COSMETIC PRODUCT LISTING
              NUMBER를 전달해 드립니다.
            </li>
          </ul>

          <h3 className="mb-2 text-base font-bold text-gray-900">
            3. 고객사 준비 정보 (모두 영문 필수)
          </h3>
          <ul className="mb-4 list-disc space-y-1 pl-5">
            <li>브랜드명, 제품명, 제품 카테고리, 전성분표(INCI)</li>
            <li>제품 전/후면 패키지 이미지 (JPG 확장자)</li>
            <li>제조시설 FEI 번호 (제조사에 요청)</li>
            <li>Responsible Person 영문명, 연락처, 이메일 주소</li>
          </ul>

          <h3 className="mb-2 text-base font-bold text-gray-900">
            4. 소요 기간
          </h3>
          <ul className="mb-4 list-disc space-y-1 pl-5">
            <li>
              고객사의 자료 제출 및 결제가 모두 완료된 이후 통상 3일~7일 정도
              소요됩니다.
            </li>
          </ul>

          <h3 className="mb-2 text-base font-bold text-gray-900">
            5. 꼭 알아두실 사항 (법적 책임)
          </h3>
          <ul className="mb-4 list-disc space-y-1 pl-5">
            <li>
              본 서비스는 등록 대행 서비스이며, FDA의 제품 승인 서비스가
              아닙니다.
            </li>
            <li>
              등록이 완료되었다고 해서 제품의 안전성, 효능, 광고 표현, 미국 내
              판매 적법성까지 FDA가 보증하는 것은 아닙니다.
            </li>
            <li>
              FDA 가이드상 시설 등록(Facility Registration)과 제품
              리스팅(Product Listing)은 법적 제출 의무이며, 이를 이행하지 않으면
              위반 문제가 될 수 있습니다.
            </li>
          </ul>

          <h3 className="mb-2 text-base font-bold text-gray-900">
            6. 클레임 및 이상사례 대응
          </h3>
          <ul className="mb-4 list-disc space-y-1 pl-5">
            <li>
              고객이 제품 사용 후 중대한 이상사례가 발생하여 영문 라벨에 기재된
              귀사(Responsible Person)의 이메일로 관련 내용을 접수한 경우,
              Responsible Person은 이를 15영업일 이내에 FDA에 보고해야 합니다.
            </li>
            <li>
              따라서 미국 수출용 제품의 영문 라벨에는 실제로 확인 및 관리가
              가능한 귀사의 이메일 주소를 반드시 기재해야 하며, 접수된 클레임
              내용을 놓치지 않도록 철저히 운영되어야 합니다.
            </li>
          </ul>

          <h3 className="mb-2 text-base font-bold text-gray-900">
            7. 당사 서비스 책임 범위
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>당사는 MOCRA 제품 리스팅 전자제출을 대행합니다.</li>
            <li>
              아래 항목은 기본 서비스 범위에 포함되지 않습니다:
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-500">
                <li>미국 법률 자문</li>
                <li>통관 대행</li>
                <li>광고 문구 법률 검토</li>
                <li>패키지 디자인 수정</li>
                <li>FDA 실사 대응</li>
                <li>이상사례 보고 대행</li>
              </ul>
            </li>
          </ul>
        </div>

        <div className="mt-6 space-y-3 border-t border-gray-200 pt-6">
          <p className={`text-sm font-semibold text-gray-800 ${kb}`}>
            신청자 정보 (동의 시 공통 정보와 함께 유지됩니다)
          </p>
          <div>
            <label
              htmlFor="tour-step-1-company"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              기업명
            </label>
            <input
              id="tour-step-1-company"
              type="text"
              autoComplete="organization"
              value={applicantName}
              onChange={(e) => {
                const raw = e.target.value;
                const sanitized = raw.replace(
                  /[^a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣0-9\s()&.-]/g,
                  "",
                );
                if (raw !== sanitized) {
                  setNameError(
                    "기업명은 영문, 한글, 숫자, 띄어쓰기 및 특수기호 ( ) & . - 만 입력 가능합니다.",
                  );
                } else {
                  setNameError("");
                }
                setApplicantName(sanitized);
                clearCommonRequiredKey("applicantName");
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ${
                nameError !== "" || commonRequiredError.applicantName === true
                  ? "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-200 focus:border-emerald-800 focus:ring-emerald-200"
              }`}
              placeholder="사업자등록증상의 기업명을 입력해주세요"
            />
            {nameError ? (
              <p className="mt-1 text-xs text-red-500">{nameError}</p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="tour-step-1-contact"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              연락처
            </label>
            <input
              id="tour-step-1-contact"
              type="tel"
              autoComplete="tel"
              value={applicantPhone}
              onChange={(e) => {
                const raw = e.target.value;
                const sanitized = raw.replace(/[^\d+\-]/g, "");
                if (raw !== sanitized) {
                  setPhoneError("+, 숫자, 하이픈(-)만 입력 가능합니다.");
                } else {
                  setPhoneError("");
                }
                setApplicantPhone(sanitized);
                clearCommonRequiredKey("applicantPhone");
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ${
                phoneError !== "" || commonRequiredError.applicantPhone === true
                  ? "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-200 focus:border-emerald-800 focus:ring-emerald-200"
              }`}
              placeholder="예: 010-1234-5678 또는 02-123-4567"
            />
            {phoneError ? (
              <p className="mt-1 text-xs text-red-500">{phoneError}</p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="tour-step-1-email"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              이메일 주소
            </label>
            <input
              id="tour-step-1-email"
              type="email"
              autoComplete="email"
              value={applicantEmail}
              onChange={(e) => {
                const raw = e.target.value;
                const sanitized = raw.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
                if (raw !== sanitized) {
                  setEmailError("이메일에는 한글을 사용할 수 없습니다.");
                } else {
                  setEmailError("");
                }
                setApplicantEmail(sanitized);
                clearCommonRequiredKey("applicantEmail");
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ${
                emailError !== "" || commonRequiredError.applicantEmail === true
                  ? "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-200 focus:border-emerald-800 focus:ring-emerald-200"
              }`}
              placeholder="example@email.com"
            />
            {emailError ? (
              <p className="mt-1 text-xs text-red-500">{emailError}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
          >
            닫기
          </button>
          <button
            id="tour-step-1-submit"
            type="button"
            onClick={handleSave}
            className="w-full cursor-pointer rounded-lg bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-stone-50 transition-colors hover:bg-emerald-900 sm:w-auto"
          >
            위 내용에 동의하고 적용하기
          </button>
        </div>
      </div>
    </div>
  );
}
