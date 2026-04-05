import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccessClient } from "./success-client";

export const metadata: Metadata = {
  title: "결제 완료 | Aicra",
  description: "MOCRA 등록비 결제가 완료되었습니다.",
};

function SuccessFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
      결제 정보를 불러오는 중…
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
