"use client";

import type { ReactNode } from "react";
import { ApplyOnboardingTour } from "@/components/apply/apply-onboarding-tour";
import { ApplyTutorialResumeFab } from "@/components/apply/apply-tutorial-resume-fab";

export function ApplyLayoutClient({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ApplyOnboardingTour />
      <ApplyTutorialResumeFab />
    </>
  );
}
