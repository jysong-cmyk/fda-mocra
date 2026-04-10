"use client";

import type { ReactNode } from "react";
import { ApplyOnboardingTour } from "@/components/apply/apply-onboarding-tour";

export function ApplyLayoutClient({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ApplyOnboardingTour />
    </>
  );
}
