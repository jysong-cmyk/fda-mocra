"use client";

export function DashboardTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-amber-200/30 bg-white p-4">
      <div className="h-10 rounded-lg bg-stone-200/80" />
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex gap-4 border-b border-stone-100 py-3 last:border-0"
        >
          <div className="h-4 flex-1 rounded bg-stone-200/70" />
          <div className="h-4 w-24 rounded bg-stone-200/60" />
          <div className="h-4 w-20 rounded bg-stone-200/60" />
        </div>
      ))}
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-amber-200/30 bg-white p-6 shadow-sm">
      <div className="h-5 w-40 rounded bg-stone-200/80" />
      <div className="mt-4 h-4 w-full max-w-xl rounded bg-stone-200/60" />
      <div className="mt-2 h-4 w-2/3 rounded bg-stone-200/50" />
    </div>
  );
}
