import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "MoCRA 등록 신청 | Aicra",
  description: "단계별 MoCRA 등록 정보 입력",
};

export default function ApplyLayout({ children }: { children: ReactNode }) {
  return children;
}
