const kb = "break-keep text-balance" as const;

const KO_EN_SCAN_LINES = [
  { ko: "글리세린", en: "Glycerin" },
  { ko: "정제수", en: "Water" },
  { ko: "병풀추출물", en: "Centella Asiatica Extract" },
] as const;

function RegisterKoEnScanPreview() {
  return (
    <div
      className="relative h-[4.25rem] w-full max-w-[11rem] shrink-0 overflow-hidden rounded-md border border-amber-200/40 bg-stone-50/90 shadow-sm sm:h-[4.5rem] sm:max-w-[12rem]"
      aria-hidden
    >
      <div
        className={`absolute inset-0 z-0 flex flex-col justify-center gap-0.5 px-2.5 py-1 ${kb}`}
      >
        {KO_EN_SCAN_LINES.map(({ ko }) => (
          <span
            key={ko}
            className="text-[10px] leading-tight tracking-tight text-zinc-400 sm:text-[11px]"
          >
            {ko}
          </span>
        ))}
      </div>
      <div
        className={`register-ko-en-scan__en absolute inset-0 z-[1] flex flex-col justify-center gap-0.5 px-2.5 py-1 ${kb}`}
      >
        {KO_EN_SCAN_LINES.map(({ en }) => (
          <span
            key={en}
            className="text-[10px] font-semibold leading-tight tracking-tight text-emerald-950 sm:text-[11px]"
          >
            {en}
          </span>
        ))}
      </div>
      <div className="register-ko-en-scan__bar pointer-events-none absolute inset-x-2 z-[2] h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_10px_rgba(251,191,36,0.45)]" />
    </div>
  );
}

export function RegisterAiTrustStrip() {
  return (
    <div
      className={`mb-4 flex flex-col items-stretch gap-3 rounded-lg border border-amber-200/40 bg-stone-50 px-3 py-2.5 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3 ${kb}`}
    >
      <p
        className={`min-w-0 flex-1 text-left text-lg font-bold leading-snug text-emerald-950 md:text-xl ${kb}`}
      >
        <span className="block">Aicra의 안내에 따라 정보를 입력하면,</span>
        <span className="mt-0.5 block sm:mt-1">
          쉽고 빠르게 MOCRA 등록이 가능합니다.
        </span>
      </p>
      <div className="flex shrink-0 justify-center sm:justify-end">
        <RegisterKoEnScanPreview />
      </div>
    </div>
  );
}
