import { Step2Client } from "./step2-client";

/** Vercel: `saveApplyProductAction` 등 무거운 Server Action 타임아웃 완화 */
export const maxDuration = 60;

export default function ApplyStep2Page() {
  return <Step2Client />;
}
