/**
 * RFC 4180 CSV 필드 인코딩.
 * 값에 쉼표(,), 줄바꿈(CR/LF), 큰따옴표(") 중 하나라도 있으면
 * 필드 전체를 "로 감싸고, 내부 "는 ""로 이스케이프합니다.
 */
export function escapeCsvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  const hasComma = s.includes(",");
  const hasQuote = s.includes('"');
  const hasLineBreak = /[\r\n]/.test(s);
  if (!hasComma && !hasQuote && !hasLineBreak) {
    return s;
  }
  return `"${s.replace(/"/g, '""')}"`;
}
