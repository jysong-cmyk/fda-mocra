"use client";

import Link from "next/link";

const kb = "break-keep text-balance" as const;

const STEPS = [
  { n: 1, href: "/apply/step1", label: "공통 정보" },
  { n: 2, href: "/apply/step2", label: "제품 정보" },
  { n: 3, href: "/apply/step3", label: "등록 목록 확인" },
] as const;

export function ApplyStepper({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  return (
    <nav
      aria-label="등록 진행 단계"
      className={`mb-8 rounded-2xl border border-amber-200/50 bg-white/90 px-3 py-4 shadow-sm shadow-emerald-950/5 sm:px-6 sm:py-5 ${kb}`}
    >
      <ol className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        {STEPS.map((step, idx) => {
          const isCurrent = activeStep === step.n;
          const isDone = activeStep > step.n;
          const isLast = idx === STEPS.length - 1;

          return (
            <li
              key={step.n}
              className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
            >
              <Link
                href={step.href}
                className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-all sm:py-3 ${
                  isCurrent
                    ? "border-emerald-600 bg-gradient-to-br from-emerald-50 to-amber-50/80 shadow-md shadow-emerald-900/10 ring-2 ring-amber-300/50"
                    : isDone
                      ? "border-emerald-200/80 bg-emerald-50/40 hover:border-emerald-300"
                      : "border-stone-200/80 bg-stone-50/50 opacity-80 hover:border-stone-300 hover:opacity-100"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                    isCurrent
                      ? "bg-emerald-950 text-amber-200 shadow-inner"
                      : isDone
                        ? "bg-emerald-700 text-white"
                        : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {isDone ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step.n
                  )}
                </span>
                <span className="min-w-0 text-left">
                  <span
                    className={`block text-[10px] font-semibold uppercase tracking-wider ${
                      isCurrent ? "text-emerald-800" : "text-zinc-500"
                    }`}
                  >
                    Step {step.n}
                  </span>
                  <span
                    className={`block truncate text-sm font-bold ${
                      isCurrent ? "text-emerald-950" : "text-zinc-700"
                    }`}
                  >
                    {step.label}
                  </span>
                </span>
              </Link>
              {!isLast ? (
                <span
                  className="hidden shrink-0 text-zinc-300 sm:inline"
                  aria-hidden
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
