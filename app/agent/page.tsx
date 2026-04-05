import Link from "next/link";

export default function AgentPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-1 flex-col px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        ← 대시보드로
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900">영업 에이전트용 · 현황 확인</h1>
      <p className="mt-2 text-zinc-600">이 페이지는 추후 현황 대시보드가 들어갑니다.</p>
    </div>
  );
}
