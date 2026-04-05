import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutFailClient } from "./fail-client";

export const metadata: Metadata = {
  title: "결제 실패 | Aicra",
  description: "MOCRA 등록비 결제에 실패했습니다.",
};

function FailFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
      오류 정보를 불러오는 중…
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={<FailFallback />}>
      <CheckoutFailClient />
    </Suspense>
  );
}
