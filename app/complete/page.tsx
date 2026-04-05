import Link from "next/link";

export default function CompletePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-lg">
        <p className="text-4xl" aria-hidden>
          ✅
        </p>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">
          접수가 완료되었습니다
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          신청하신 제품 정보가 정상적으로 저장되었습니다. 안내에 따라 결제 및
          이후 절차를 진행해 주세요.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          처음으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
