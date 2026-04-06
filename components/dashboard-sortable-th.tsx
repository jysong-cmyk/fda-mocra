"use client";

import type { SortDir } from "@/lib/dashboard-data";

type Props = {
  label: string;
  sortKey: string;
  activeKey: string;
  dir: SortDir;
  onSort: (key: string) => void;
  className?: string;
};

export function SortableTh({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className = "",
}: Props) {
  const active = activeKey === sortKey;
  const arrow = !active ? (
    <span className="ml-0.5 text-[10px] font-normal text-amber-200/50">↕</span>
  ) : dir === "asc" ? (
    <span className="ml-0.5 text-amber-200" aria-hidden>
      ↑
    </span>
  ) : (
    <span className="ml-0.5 text-amber-200" aria-hidden>
      ↓
    </span>
  );

  return (
    <th scope="col" className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex w-full cursor-pointer items-center gap-0.5 text-left text-xs font-semibold uppercase tracking-wide text-amber-100/95 transition-colors hover:text-amber-50"
      >
        {label}
        {arrow}
      </button>
    </th>
  );
}
