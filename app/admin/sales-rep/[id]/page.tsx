"use client";

import type { Session } from "@supabase/supabase-js";
import { AicraHeader } from "@/components/aicra-header";
import { DashboardBackLink } from "@/components/dashboard-back-link";
import {
  DashboardCardSkeleton,
  DashboardTableSkeleton,
} from "@/components/dashboard-skeleton";
import { IconChevronRight } from "@/components/icon-chevron-right";
import {
  companyKeyFromApplicant,
  decodeDrilldownId,
  encodeDrilldownId,
} from "@/lib/dashboard-routes";
import {
  bucketStatus,
  groupProductsByCompany,
  statusBadgeLabel,
} from "@/lib/dashboard-data";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const kb = "break-keep text-balance" as const;
const ADMIN_EMAIL = "jysong@depack.co.kr";

type ProductRow = {
  id?: string;
  created_at?: string | null;
  applicant_name?: string | null;
  applicant_email?: string | null;
  applicant_phone?: string | null;
  product_name_en?: string | null;
  recommender_name?: string | null;
  status?: string | null;
  paid_at?: string | null;
};

function formatDateYmd(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isAllowedAdminSession(s: Session | null): boolean {
  return s?.user?.email === ADMIN_EMAIL;
}

export default function AdminSalesRepDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const idParam = Array.isArray(rawId) ? rawId[0] : rawId;

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repKey, setRepKey] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (qErr != null) {
      setError(qErr.message);
      setRows([]);
    } else {
      setRows((data as ProductRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (idParam == null || idParam === "") {
      setDecodeError("잘못된 경로입니다.");
      setRepKey(null);
      return;
    }
    try {
      setRepKey(decodeDrilldownId(decodeURIComponent(idParam)));
      setDecodeError(null);
    } catch {
      setDecodeError("담당자 식별 정보를 해석할 수 없습니다.");
      setRepKey(null);
    }
  }, [idParam]);

  useEffect(() => {
    if (authLoading || !isAllowedAdminSession(session) || repKey == null) {
      return;
    }
    void load();
  }, [authLoading, session, repKey, load]);

  const repProducts = useMemo(() => {
    if (repKey == null) return [];
    return rows.filter((r) => {
      const raw = r.recommender_name?.trim() ?? "";
      const key = raw !== "" ? raw : "(미지정)";
      return key === repKey;
    });
  }, [rows, repKey]);

  const companies = useMemo(
    () => groupProductsByCompany(repProducts),
    [repProducts],
  );

  const repStats = useMemo(() => {
    let pending = 0;
    let prog = 0;
    let done = 0;
    for (const p of repProducts) {
      const b = bucketStatus(p);
      if (b === "결제 대기") pending += 1;
      else if (b === "진행 중") prog += 1;
      else done += 1;
    }
    return { pending, prog, done, total: repProducts.length };
  }, [repProducts]);

  if (authLoading) {
    return (
      <div className={`min-h-screen bg-stone-50 ${kb}`}>
        <AicraHeader page="admin" />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <DashboardCardSkeleton />
          <div className="mt-6">
            <DashboardTableSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!isAllowedAdminSession(session)) {
    return (
      <div className={`min-h-screen bg-stone-50 p-8 ${kb}`}>
        <AicraHeader page="admin" />
        <p className="text-center text-sm text-zinc-600">
          관리자만 접근할 수 있습니다.
        </p>
        <DashboardBackLink href="/admin" />
      </div>
    );
  }

  if (decodeError != null || repKey == null) {
    return (
      <div className={`min-h-screen bg-stone-50 ${kb}`}>
        <AicraHeader page="admin" />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <DashboardBackLink href="/admin" />
          <p className="mt-4 text-sm text-red-600">{decodeError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-stone-50 ${kb}`}>
      <AicraHeader page="admin" />
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6">
        <DashboardBackLink href="/admin" />
        <h1 className="mt-4 text-2xl font-bold text-emerald-950 sm:text-3xl">
          영업 담당자 · {repKey}
        </h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-amber-200/30 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500">총 SKU</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-950">
              {loading ? "—" : repStats.total}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200/30 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500">결제 대기</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">
              {loading ? "—" : repStats.pending}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200/30 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500">진행 중</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">
              {loading ? "—" : repStats.prog}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200/30 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500">완료</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-900">
              {loading ? "—" : repStats.done}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8">
            <DashboardTableSkeleton rows={6} />
          </div>
        ) : error != null ? (
          <p className="mt-8 text-sm text-red-600">{error}</p>
        ) : (
          <>
            <div className="mt-8 overflow-hidden rounded-2xl border border-amber-200/30 bg-white shadow-lg">
              <div className="border-b border-amber-200/40 bg-emerald-950/5 px-5 py-4">
                <h2 className="text-base font-bold text-emerald-950">
                  담당 기업 목록
                </h2>
                <p className="mt-1 text-xs text-zinc-600">
                  기업명을 눌러 SKU 상세로 이동합니다.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-amber-200/50 bg-emerald-950">
                      <th className="px-5 py-3.5 text-xs font-semibold text-amber-100/95">
                        기업명
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-amber-100/95">
                        SKU 수
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-amber-100/95">
                        그룹 상태
                      </th>
                      <th className="w-12 px-3 py-3.5" aria-hidden />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/80">
                    {companies.map((g) => (
                      <tr key={g.applicant_name} className="hover:bg-stone-50">
                        <td className="px-0 py-0" colSpan={4}>
                          <Link
                            href={`/admin/company/${encodeDrilldownId(g.applicant_name)}`}
                            className={`flex cursor-pointer items-center gap-2 px-5 py-4 transition-colors hover:bg-stone-50 ${kb}`}
                          >
                            <span className="flex-1 font-semibold text-emerald-950">
                              {g.applicant_name}
                            </span>
                            <span className="tabular-nums font-medium text-amber-800">
                              {g.skuCount}
                            </span>
                            <span className="inline-flex rounded-full bg-amber-100/80 px-2 py-0.5 text-xs font-semibold text-emerald-950 ring-1 ring-amber-300/50">
                              {g.status}
                            </span>
                            <IconChevronRight />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-amber-200/30 bg-white shadow-lg">
              <div className="border-b border-amber-200/40 bg-emerald-950/5 px-5 py-4">
                <h2 className="text-base font-bold text-emerald-950">
                  최근 제품 행
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-amber-200/50 bg-emerald-950">
                      <th className="px-4 py-3 text-xs font-semibold text-amber-100/95">
                        접수일
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-amber-100/95">
                        기업
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-amber-100/95">
                        제품
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-amber-200/95">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/80">
                    {repProducts.slice(0, 30).map((p, idx) => (
                      <tr
                        key={p.id ?? idx}
                        className="hover:bg-stone-50"
                      >
                        <td className="px-4 py-3.5 tabular-nums text-zinc-700">
                          {formatDateYmd(p.created_at ?? undefined)}
                        </td>
                        <td className="px-4 py-3.5 text-emerald-950">
                          {companyKeyFromApplicant(p.applicant_name)}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-800">
                          {p.product_name_en?.trim() || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          {statusBadgeLabel(p)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
