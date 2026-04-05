import type { ReactNode } from "react";

export function ApplyFieldLabel({
  htmlFor,
  children,
  tooltip,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  tooltip?: string;
}) {
  const labelClass = "text-sm font-medium text-zinc-800";
  return (
    <div className="mb-1.5 flex items-center gap-2">
      {htmlFor != null ? (
        <label htmlFor={htmlFor} className={labelClass}>
          {children}
        </label>
      ) : (
        <span className={labelClass}>{children}</span>
      )}
      {tooltip != null ? (
        <span className="group relative inline-flex shrink-0">
          <span
            className="flex h-5 w-5 cursor-help items-center justify-center rounded-full bg-zinc-300 text-[10px] font-bold text-zinc-600"
            aria-hidden
          >
            ?
          </span>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-[min(280px,calc(100vw-3rem))] -translate-x-1/2 rounded-lg bg-black px-3 py-2 text-left text-xs font-normal leading-relaxed text-white shadow-lg group-hover:block"
          >
            {tooltip}
          </span>
        </span>
      ) : null}
    </div>
  );
}

export function Ag({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-amber-600">{children}</span>;
}
