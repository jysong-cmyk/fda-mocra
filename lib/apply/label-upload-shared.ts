/** `labels-storage.ts`와 서버 action에서 공유 — 클라이언트 Storage 클라이언트 없음 */
export function sanitizeLabelStorageFileName(name: string): string {
  const trimmed = name.trim();
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe.length > 0 ? safe : "image";
}

/** apply 브라우저 session_id (UUID 문자열) — 경로 조작 방지 */
export function isValidApplySessionId(raw: string): boolean {
  const s = raw.trim();
  if (s === "" || s.includes("/") || s.includes("..")) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s,
  );
}

const LABEL_MAX_FILES = 4;
const LABEL_MAX_BYTES = 10 * 1024 * 1024;
const LABEL_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateLabelFilesForUpload(files: File[]): string | null {
  if (files.length === 0) return "업로드할 파일이 없습니다.";
  if (files.length > LABEL_MAX_FILES) {
    return `라벨 이미지는 최대 ${LABEL_MAX_FILES}장까지 업로드할 수 있습니다.`;
  }
  for (const f of files) {
    if (!LABEL_ALLOWED_MIME.has(f.type)) {
      return "이미지 파일(JPEG, PNG, WebP, GIF)만 업로드할 수 있습니다.";
    }
    if (f.size > LABEL_MAX_BYTES) {
      return "파일당 최대 10MB까지 업로드할 수 있습니다.";
    }
  }
  return null;
}
