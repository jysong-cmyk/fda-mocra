"use client";

import type { DateFieldMode } from "@/lib/dashboard-data";
import { STATUS_OPTIONS } from "@/lib/dashboard-data";

const kb = "break-keep text-balance" as const;

const toolbarClass =
  `mb-4 rounded-xl border border-amber-200/30 bg-white p-4 shadow-sm shadow-emerald-950/[0.04] sm:p-5 ${kb}`;

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  dateField: DateFieldMode;
  onDateFieldChange: (v: DateFieldMode) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
};

export function DashboardFilterToolbar({
  search,
  onSearchChange,
  dateField,
  onDateFieldChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  status,
  onStatusChange,
}: Props) {
  return (
    <div className={toolbarClass}>
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-950">
        통합 필터
      </p>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="min-w-0 flex-1 lg:max-w-md">
          <label
            htmlFor="dash-filter-search"
            className="mb-1 block text-xs font-semibold text-emerald-950/80"
          >
            기업명 · 담당자명 검색
          </label>
          <input
            id="dash-filter-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="기업명 또는 영업 담당자명"
            className="w-full rounded-lg border border-amber-200/40 bg-stone-50/80 px-3 py-2.5 text-sm text-emerald-950 outline-none ring-emerald-950/10 placeholder:text-zinc-400 focus:border-emerald-800 focus:ring-2 focus:ring-amber-400/25"
          />
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:gap-3">
          <div>
            <label
              htmlFor="dash-date-field"
              className="mb-1 block text-xs font-semibold text-emerald-950/80"
            >
              날짜 기준
            </label>
            <select
              id="dash-date-field"
              value={dateField}
              onChange={(e) =>
                onDateFieldChange(e.target.value as DateFieldMode)
              }
              className="rounded-lg border border-amber-200/40 bg-stone-50/80 px-3 py-2.5 text-sm font-medium text-emerald-950 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-amber-400/25"
            >
              <option value="created">등록일(접수일)</option>
              <option value="paid">결제일</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="dash-date-from"
              className="mb-1 block text-xs font-semibold text-emerald-950/80"
            >
              시작일
            </label>
            <input
              id="dash-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-[min(100%,11rem)] rounded-lg border border-amber-200/40 bg-stone-50/80 px-3 py-2.5 text-sm tabular-nums text-emerald-950 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-amber-400/25"
            />
          </div>
          <div>
            <label
              htmlFor="dash-date-to"
              className="mb-1 block text-xs font-semibold text-emerald-950/80"
            >
              종료일
            </label>
            <input
              id="dash-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-[min(100%,11rem)] rounded-lg border border-amber-200/40 bg-stone-50/80 px-3 py-2.5 text-sm tabular-nums text-emerald-950 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-amber-400/25"
            />
          </div>
          <div>
            <label
              htmlFor="dash-status"
              className="mb-1 block text-xs font-semibold text-emerald-950/80"
            >
              진행 상태
            </label>
            <select
              id="dash-status"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="min-w-[10rem] rounded-lg border border-amber-200/40 bg-stone-50/80 px-3 py-2.5 text-sm font-medium text-emerald-950 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-amber-400/25"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
        결제일 기준은 DB에 결제일(paid_at)이 있으면 해당 값으로, 없으면 접수일과
        동일하게 필터됩니다.
      </p>
    </div>
  );
}
