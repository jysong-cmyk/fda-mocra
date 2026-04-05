"use client";

import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AicraHeader } from "../components/aicra-header";
import { RevealOnScroll } from "../components/reveal-on-scroll";

const k = "break-keep text-balance" as const;

/** 본문 카피 속 브랜드명 강조 */
function Ag({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-amber-400">{children}</span>;
}

function IconMoney({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m-3-9h4.5a1.5 1.5 0 010 3H9m6 0h.75a1.5 1.5 0 010 3H9m3-9V6m0 12v-1.5"
      />
      <rect x="3" y="5" width="18" height="14" rx="2" />
    </svg>
  );
}

function IconRocket({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 11l3.5 3.5M9 21l2-4m0 0l4-8 4-4-4 4-8 4zm0 0H5v4"
      />
    </svg>
  );
}

function IconAi({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
      <path strokeLinecap="round" d="M9 9h.01M15 9h.01" />
    </svg>
  );
}

function IconKorean({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h2.5a1.5 1.5 0 010 3H8m4-4.5V15m0-4.5h2a2 2 0 010 4h-2"
      />
    </svg>
  );
}

function IconDocScan({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function IconStepInput({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function IconStepTransform({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
      />
    </svg>
  );
}

function IconStepComplete({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function LandingContent() {
  return (
    <div className="min-h-full bg-stone-50 text-zinc-900">
      <AicraHeader page="home" />

      {/* Hero — full-bleed image + dark overlay */}
      <section className="relative min-h-[calc(100svh-4.25rem)] w-full sm:min-h-[calc(100svh-4.25rem)]">
        <Image
          src="/hero-custom.png"
          alt="Aicra 브랜드 비주얼"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-emerald-950/82 via-emerald-950/60 to-emerald-950/85"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-emerald-950/25"
          aria-hidden
        />
        <div className="relative flex min-h-[calc(100svh-4.25rem)] flex-col items-center justify-center px-5 py-16 text-center sm:px-8 sm:py-24">
          <h1
            className={`flex max-w-[min(100%,40rem)] flex-col items-center gap-y-6 text-center tracking-tight md:max-w-[42rem] md:gap-y-8 ${k}`}
          >
            <span className="block w-full text-[1.65rem] font-bold leading-relaxed tracking-tight text-stone-50 sm:text-4xl sm:leading-relaxed md:text-5xl md:leading-relaxed lg:text-6xl lg:leading-relaxed">
              MOCRA 등록
            </span>
            <span className="block w-full text-[1.65rem] font-bold leading-relaxed tracking-tight text-stone-50 sm:text-4xl sm:leading-relaxed md:text-5xl md:leading-relaxed lg:text-6xl lg:leading-relaxed">
              <span className="font-extrabold text-amber-400 drop-shadow-[0_1px_12px_rgba(251,191,36,0.22)]">
                Aicra
              </span>
              로 쉽고 빠르게
            </span>
          </h1>
          <Link
            href="/register"
            className={`mt-10 inline-flex max-w-[min(100%,22rem)] items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-amber-200 to-amber-300 px-5 py-3 text-xs font-semibold text-emerald-950 shadow-lg shadow-black/20 ring-1 ring-amber-400/50 transition hover:from-emerald-800 hover:to-emerald-700 hover:text-stone-50 hover:ring-emerald-600/30 sm:max-w-none sm:gap-2 sm:px-8 sm:py-3.5 sm:text-sm md:mt-14 md:px-10 md:py-4 md:text-base ${k}`}
          >
            Aicra와 함께 지금 바로 등록하기
            <span aria-hidden className="text-base sm:text-lg">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* 4 strengths */}
      <section className="border-b border-amber-900/10 bg-stone-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <RevealOnScroll>
            <h2
              className={`mb-16 text-center text-2xl font-bold text-emerald-950 sm:mb-20 sm:text-3xl ${k}`}
            >
              <Ag>Aicra</Ag>가 제공하는 가치
            </h2>
          </RevealOnScroll>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {(
              [
                {
                  Icon: IconMoney,
                  title: "합리적인 가격",
                  desc: "불필요한 대행 수수료를 제거하여 수출 초기 비용 부담을 획기적으로 낮췄습니다.",
                },
                {
                  Icon: IconRocket,
                  title: "단 3일의 소요 기간",
                  desc: "결제 완료 후 영업일 기준 3일 이내에 FDA 등록 및 리스팅을 완벽하게 마무리합니다.",
                },
                {
                  Icon: IconAi,
                  title: "쉽고 간편한 등록",
                  desc: (
                    <>
                      <Ag>Aicra</Ag>의 지능형 프로세스가 복잡한 MOCRA 규정에 맞춰
                      최적의 가이드를 제공하여 누구나 실수 없이 작성 가능합니다.
                    </>
                  ),
                },
                {
                  Icon: IconKorean,
                  title: "Aicra 가이드 기반 지원",
                  desc: (
                    <>
                      절차마다 <Ag>Aicra</Ag> 가이드에 따른 정보 입력을
                      안내받아, 누락 없이 체계적으로 등록을 마무리할 수
                      있습니다.
                    </>
                  ),
                },
              ] satisfies ReadonlyArray<{
                Icon: ComponentType<{ className?: string }>;
                title: string;
                desc: ReactNode;
              }>
            ).map(({ Icon, title, desc }) => (
              <RevealOnScroll key={title}>
                <article
                  className={`flex h-full min-h-0 flex-col rounded-2xl border border-amber-200/35 bg-white p-6 shadow-sm shadow-emerald-950/[0.04] transition hover:border-amber-300/50 hover:shadow-md sm:p-7 ${k}`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-950 text-amber-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-bold leading-snug text-emerald-950 sm:text-lg">
                    {title}
                  </h3>
                  <p className="mt-3 grow text-sm leading-relaxed text-zinc-600 sm:mt-4 sm:leading-[1.65]">
                    {desc}
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* MOCRA & RP — infographic */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <RevealOnScroll>
            <p
              className={`mb-3 text-center text-xs font-bold tracking-widest text-amber-600 sm:text-sm ${k}`}
            >
              GATEWAY ➔ CORE REGULATION
            </p>
            <h2
              className={`mx-auto mb-16 max-w-[min(100%,40rem)] text-center text-2xl font-bold leading-snug text-emerald-950 sm:mb-20 sm:max-w-[44rem] sm:text-3xl sm:leading-tight ${k}`}
            >
              성공적인 미국 진출의 시작, MOCRA와 RP의 이해
            </h2>
          </RevealOnScroll>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <RevealOnScroll>
              <div
                className={`relative overflow-hidden rounded-3xl border border-amber-200/30 bg-gradient-to-br from-stone-50 to-emerald-50/50 p-8 sm:p-10 ${k}`}
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-950/5" />
                <span className="inline-flex rounded-full bg-emerald-950 px-3 py-1 text-xs font-semibold text-amber-200">
                  MOCRA
                </span>
                <h3 className="mt-6 text-xl font-bold text-emerald-950">
                  제품 리스팅
                </h3>
                <div className="mt-8 space-y-5">
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-sm font-bold text-amber-200">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-emerald-950">
                        법적 제출 의무
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                        미국 유통 화장품은 시설 등록과 제품 리스팅이 요구됩니다.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-950/20 bg-white text-sm font-bold text-emerald-950">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-emerald-950">
                        Cosmetics Direct
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                        FDA 전자 시스템에 맞춘 정보 정리가 핵심입니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div
                className={`relative overflow-hidden rounded-3xl border border-amber-200/30 bg-gradient-to-br from-emerald-950 to-emerald-900 p-8 text-stone-50 sm:p-10 ${k}`}
              >
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-400/10" />
                <span className="inline-flex rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200">
                  RP
                </span>
                <h3 className="mt-6 text-xl font-bold text-stone-50">
                  Responsible Person
                </h3>
                <div className="mt-8 space-y-5">
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/25 text-sm font-bold text-amber-100">
                      A
                    </span>
                    <div>
                      <p className="font-semibold text-stone-50">라벨상 주체</p>
                      <p className="mt-1 text-sm leading-relaxed text-emerald-100/85">
                        영문 라벨에 표기된 판매 책임자 정보가 리스팅과 일치해야
                        합니다.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-emerald-950/50 text-sm font-bold text-amber-200">
                      B
                    </span>
                    <div>
                      <p className="font-semibold text-stone-50">연락·보고</p>
                      <p className="mt-1 text-sm leading-relaxed text-emerald-100/85">
                        클레임·이상사례 대응 등 규제상 연락 창구 역할을 합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* 언어 지원 · Aicra 매핑 */}
      <section className="border-t border-amber-900/10 bg-stone-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <RevealOnScroll>
            <div className="mx-auto max-w-3xl text-center">
              <h2
                className={`text-2xl font-bold leading-snug tracking-tight text-emerald-950 sm:text-3xl md:text-[1.75rem] md:leading-tight ${k}`}
              >
                <span className="block">언어의 장벽을 넘어,</span>
                <span className="mt-2 block sm:mt-3">
                  복잡한 규제까지 <Ag>Aicra</Ag>가 한 번에 해결합니다.
                </span>
              </h2>
              <p
                className={`mx-auto mt-6 max-w-2xl text-left text-[15px] leading-[1.75] text-zinc-600 sm:text-center sm:text-base sm:leading-relaxed ${k}`}
              >
                INCI·규정 검토에 쓰는 부담은 줄이고, 제품 정보만 입력하면{" "}
                <Ag>Aicra</Ag>가 실시간 영문 매핑부터 규정 검토까지 완벽하게
                해결해 드립니다.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="mt-12 sm:mt-14">
            <div
              className={`relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-amber-200/40 bg-white p-6 shadow-lg shadow-emerald-950/[0.07] sm:p-10 ${k}`}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,transparent_0%,rgba(251,191,36,0.04)_35%,rgba(6,78,59,0.04)_65%,transparent_100%)]" />
              <p className="relative text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800/55">
                Live mapping preview
              </p>
              <div className="relative mt-6 flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-5">
                <div className="flex flex-1 flex-col justify-center rounded-2xl border border-emerald-950/10 bg-stone-50/90 p-5 lg:max-w-[13.5rem]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    KO · 입력
                  </p>
                  <p
                    className={`mt-3 text-sm font-medium leading-relaxed text-emerald-950 ${k}`}
                  >
                    글리세린, 나이아신아마이드,
                    <br />
                    판테놀, 알란토인…
                  </p>
                  <p className={`mt-3 text-xs leading-relaxed text-zinc-500 ${k}`}>
                    익숙한 표현으로 그대로 적어도 됩니다.
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-3 py-2 lg:w-28 lg:shrink-0">
                  <span className="hidden text-amber-500/80 lg:inline" aria-hidden>
                    →
                  </span>
                  <span className="text-2xl text-amber-500/70 lg:hidden" aria-hidden>
                    ↓
                  </span>
                  <span className="rounded-full bg-emerald-950 px-3 py-1 text-[10px] font-bold tracking-wide text-amber-200">
                    <span className="text-amber-300">Aicra</span> 통합 솔루션
                  </span>
                </div>
                <div className="relative flex min-h-[11rem] flex-1 flex-col overflow-hidden rounded-2xl border border-emerald-950/12 bg-gradient-to-br from-emerald-950/[0.04] to-amber-50/30 p-5">
                  <div className="ocr-scan-line pointer-events-none absolute inset-x-5 top-0 z-10 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/60">
                    EN · INCI output
                  </p>
                  <p className="mt-3 font-mono text-[11px] leading-relaxed text-emerald-900/85 sm:text-xs">
                    Water, Glycerin, Niacinamide,
                    <br />
                    Panthenol, Allantoin…
                  </p>
                  <p
                    className={`mt-auto pt-4 text-xs font-medium leading-snug text-zinc-600 ${k}`}
                  >
                    <Ag>Aicra</Ag>가 인식한 내용이 영문 INCI로 정리되는 흐름을
                    재현했습니다.
                  </p>
                </div>
              </div>
              <div className="relative mt-6 flex items-center justify-center gap-2 border-t border-amber-100/80 pt-5 text-center text-[11px] text-zinc-500 sm:text-xs">
                <IconDocScan className="h-4 w-4 shrink-0 text-emerald-800/50" />
                <span className={k}>
                  이미지 업로드 시에도 <Ag>Aicra</Ag>가 동일한 지능형 파이프라인으로
                  텍스트를 추출합니다.
                </span>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="mt-10 sm:mt-12">
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3 sm:gap-5">
              <div
                className={`flex flex-col items-center rounded-2xl border border-amber-100 bg-white px-4 py-5 text-center shadow-sm ${k}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950 text-amber-300">
                  <IconStepInput className="h-5 w-5" />
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-amber-700/90">
                  입력
                </p>
                <p className="mt-2 text-sm font-medium leading-snug text-emerald-950">
                  스마트 가이드에 따라 제품 정보 입력
                </p>
              </div>
              <div
                className={`flex flex-col items-center rounded-2xl border border-amber-100 bg-white px-4 py-5 text-center shadow-sm ${k}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950 text-amber-300">
                  <IconStepTransform className="h-5 w-5" />
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-amber-700/90">
                  <Ag>Aicra</Ag> 지능형 검토
                </p>
                <p className="mt-2 text-sm font-medium leading-snug text-emerald-950">
                  실시간 영문 성분(INCI) 정밀 매핑
                </p>
              </div>
              <div
                className={`flex flex-col items-center rounded-2xl border border-amber-100 bg-white px-4 py-5 text-center shadow-sm ${k}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950 text-amber-300">
                  <IconStepComplete className="h-5 w-5" />
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-amber-700/90">
                  완성
                </p>
                <p className="mt-2 text-sm font-medium leading-snug text-emerald-950">
                  <Ag>Aicra</Ag>가 FDA 규격에 맞는 영문 서류를 완성
                </p>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="mt-10 flex justify-center sm:mt-12">
            <Link
              href="/register"
              className={`inline-flex items-center gap-1.5 rounded-full border border-amber-400/45 bg-gradient-to-r from-amber-200/95 to-amber-300/90 px-5 py-2.5 text-sm font-semibold text-emerald-950 shadow-md shadow-emerald-950/10 ring-1 ring-amber-400/40 transition hover:from-emerald-800 hover:to-emerald-700 hover:text-stone-50 hover:ring-emerald-600/25 ${k}`}
            >
              Aicra와 함께 지금 바로 등록하기
              <span aria-hidden>→</span>
            </Link>
          </RevealOnScroll>
        </div>
      </section>

      <footer className="border-t border-amber-900/10 bg-emerald-950 py-16 text-center sm:py-20">
        <p className={`text-sm font-semibold text-amber-300 ${k}`}>Aicra</p>
        <p
          className={`mx-auto mt-3 max-w-md px-4 text-xs leading-relaxed text-emerald-200/75 ${k}`}
        >
          MOCRA 등록·RP 지정을{" "}
          <span className="font-semibold text-amber-300">Aicra</span>가
          단순화합니다.
        </p>
        <Link
          href="/register"
          className={`mt-8 inline-block text-sm font-medium text-amber-300 underline-offset-4 hover:text-amber-200 hover:underline ${k}`}
        >
          Aicra와 함께 지금 바로 등록하기 →
        </Link>
        <p
          className={`mx-auto mt-10 max-w-xl px-4 text-[11px] leading-relaxed text-emerald-300/60 ${k}`}
        >
          본 서비스는 FDA 또는 미국 정부의 공식 서비스가 아닙니다.
        </p>
      </footer>
    </div>
  );
}
