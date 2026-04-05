import type { Metadata } from "next";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "MOCRA 등록비 결제 | Aicra",
  description: "FDA MOCRA 등록비 안전 결제 — 토스페이먼츠",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
