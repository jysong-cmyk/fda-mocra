import type { Metadata } from "next";
import { LandingContent } from "./landing-content";

export const metadata: Metadata = {
  title: "Aicra | MOCRA 등록, Aicra로 쉽고 빠르게",
  description:
    "에이크라(Aicra) — MOCRA 등록·리스팅을 합리적인 가격과 3일 소요, 단계별 가이드와 Aicra가 제공하는 AI 솔루션으로 돕습니다.",
};

export default function HomePage() {
  return <LandingContent />;
}
