/** 드릴다운 URL용 안전 ID (한글·특수문자 기업명/담당자명) */

export function encodeDrilldownId(text: string): string {
  let b64: string;
  if (typeof Buffer !== "undefined") {
    b64 = Buffer.from(text, "utf-8").toString("base64");
  } else {
    const utf8 = new TextEncoder().encode(text);
    let binary = "";
    for (let i = 0; i < utf8.length; i++) {
      binary += String.fromCharCode(utf8[i]!);
    }
    b64 = btoa(binary);
  }
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeDrilldownId(segment: string): string {
  const pad =
    segment.length % 4 === 0 ? "" : "=".repeat(4 - (segment.length % 4));
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/** products 그룹 키와 동일 규칙 */
export function companyKeyFromApplicant(
  name: string | null | undefined,
): string {
  const raw = name?.trim() ?? "";
  return raw !== "" ? raw : "(기업명 미입력)";
}
