import type { ReactNode } from "react";

const kb = "break-keep text-balance" as const;

export function ApplyShell({ children }: { children: ReactNode }) {
  return (
    <div className={`flex min-h-full flex-1 flex-col bg-stone-50 ${kb}`}>
      {children}
    </div>
  );
}

export function ApplyCardHeader() {
  return (
    <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 px-6 py-6 sm:px-8 sm:py-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/90">
        Aicra
      </p>
      <h1 className="mt-2 text-2xl font-bold leading-snug text-stone-50 sm:text-3xl">
        화장품 미국 MoCRA 등록
      </h1>
    </div>
  );
}
