import { Step3Client } from "./step3-client";

/** Vercel: `deleteApplyCartLineAction` 등 Server Action 타임아웃 완화 */
export const maxDuration = 60;

export default function ApplyStep3Page() {
  return <Step3Client />;
}
