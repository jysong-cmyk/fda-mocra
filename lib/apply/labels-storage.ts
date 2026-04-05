/** 업로드 대상 버킷명 — 서버 action·파서에서 공통 사용 */
export const APPLY_LABELS_BUCKET = "labels" as const;

const PUBLIC_PATH_MARKER = "/object/public/labels/";

/**
 * `products.label_image_url`에 저장된 공개 URL들(쉼표 구분)에서
 * Storage `remove()`용 객체 경로만 추출합니다.
 */
export function parseLabelObjectPathsFromField(
  labelImageUrlField: string,
): string[] {
  const trimmed = labelImageUrlField.trim();
  if (trimmed === "") return [];

  const paths: string[] = [];
  for (const raw of trimmed.split(",")) {
    const u = raw.trim();
    if (u === "") continue;
    try {
      const url = new URL(u);
      const idx = url.pathname.indexOf(PUBLIC_PATH_MARKER);
      if (idx === -1) continue;
      const encoded = url.pathname.slice(idx + PUBLIC_PATH_MARKER.length);
      const path = decodeURIComponent(encoded);
      if (path !== "") paths.push(path);
    } catch {
      const idx = u.indexOf(PUBLIC_PATH_MARKER);
      if (idx === -1) continue;
      const rest = u.slice(idx + PUBLIC_PATH_MARKER.length).split(/[?#]/)[0] ?? "";
      const path = decodeURIComponent(rest);
      if (path !== "") paths.push(path);
    }
  }
  return paths;
}
