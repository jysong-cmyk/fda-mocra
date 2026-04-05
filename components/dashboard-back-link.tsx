"use client";

import Link from "next/link";

const kb = "break-keep text-balance" as const;

type Props = {
  href: string;
  label?: string;
};

export function DashboardBackLink({
  href,
  label = "← 목록으로 돌아가기",
}: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 transition-colors hover:text-emerald-950 ${kb}`}
    >
      {label}
    </Link>
  );
}
