"use client";

import type { Session } from "@supabase/supabase-js";
import { AicraHeader } from "@/components/aicra-header";
import { DashboardBackLink } from "@/components/dashboard-back-link";
import {
  DashboardCardSkeleton,
  DashboardTableSkeleton,
} from "@/components/dashboard-skeleton";
import {
  companyKeyFromApplicant,
  decodeDrilldownId,
} from "@/lib/dashboard-routes";
import { bucketStatus, statusBadgeLabel } from "@/lib/dashboard-data";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const kb = "break-keep text-balance" as const;
const ADMIN_EMAIL = "jysong@depack.co.kr";

type ProductRow = {
  id?: string;
  created_at?: string | null;
  rp_name_en?: string | null;
  rp_contact?: string | null;
  product_name_en?: string | null;
  fei_number?: string | null;
  category1?: string | null;
  category2?: string | null;
  category3?: string | null;
  ingredient_text?: string | null;
  recommender_name?: string | null;
  status?: string | null;
  applicant_name?: string | null;
  applicant_phone?: string | null;
  applicant_email?: string | null;
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

function inciStatus(row: ProductRow): string {
  const t = row.ingredient_text?.trim();
  return t != null && t !== "" ? "입력됨" : "미입력";
}

function docStatus(row: ProductRow): string {
  return statusBadgeLabel(row);
}

function paymentLabel(row: ProductRow): string {
  if (row.paid_at != null && row.paid_at.trim() !== "") {
    return `결제 ${formatDateYmd(row.paid_at)}`;
  }
  return "결제 대기";
}

function isAllowedAdminSession(s: Session | null): boolean {
  return s?.user?.email === ADMIN_EMAIL;
}

export default function AdminCompanyDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const idParam = Array.isArray(rawId) ? rawId[0] : rawId;

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [companyKey, setCompanyKey] = useState<string | null>(null);

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
      setCompanyKey(null);
      return;
    }
    try {
      const key = decodeDrilldownId(decodeURIComponent(idParam));
      setCompanyKey(key);
      setDecodeError(null);
    } catch {
      setDecodeError("기업 식별 정보를 해석할 수 없습니다.");
      setCompanyKey(null);
    }
  }, [idParam]);

  useEffect(() => {
    if (authLoading || !isAllowedAdminSession(session) || companyKey == null) {
      return;
    }
    void load();
  }, [authLoading, session, companyKey, load]);

  const companyProducts = useMemo(() => {
    if (companyKey == null) return [];
    return rows.filter(
      (r) => companyKeyFromApplicant(r.applicant_name) === companyKey,
    );
  }, [rows, companyKey]);

  const headerContact = useMemo(() => {
    const first = companyProducts[0];
    if (first == null) return { email: "—", phone: "—" };
    return {
      email: first.applicant_email?.trim() || "—",
      phone: first.applicant_phone?.trim() || "—",
    };
  }, [companyProducts]);

  const progressPct = useMemo(() => {
    if (companyProducts.length === 0) return 0;
    let done = 0;
    for (const p of companyProducts) {
      if (bucketStatus(p) === "완료") done += 1;
    }
    return Math.round((done / companyProducts.length) * 100);
  }, [companyProducts]);

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

  if (decodeError != null || companyKey == null) {
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
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-950 sm:text-3xl">
              {companyKey}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              {headerContact.email} · {headerContact.phone}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200/40 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500">진행률(완료 SKU)</p>
            <p className="text-xl font-bold tabular-nums text-emerald-800">
              {loading ? "—" : `${progressPct}%`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 space-y-4">
            <DashboardTableSkeleton rows={5} />
          </div>
        ) : error != null ? (
          <p className="mt-8 text-sm text-red-600">{error}</p>
        ) : companyProducts.length === 0 ? (
          <p className="mt-8 rounded-xl border border-amber-200/30 bg-white p-8 text-center text-sm text-zinc-500">
            해당 기업의 제품이 없습니다.
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-amber-200/30 bg-white shadow-lg shadow-emerald-950/5">
            <div className="border-b border-amber-200/40 bg-emerald-950/5 px-5 py-4">
              <h2 className="text-base font-bold text-emerald-950">
                SKU별 현황
              </h2>
              <p className="mt-1 text-xs text-zinc-600">
                결제·진행·INCI·서류 상태를 한눈에 확인합니다.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b border-amber-200/50 bg-emerald-950">
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-100/95">
                      제품명
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-100/95">
                      접수일
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-100/95">
                      결제
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-100/95">
                      진행
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-200/95">
                      INCI
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-200/95">
                      서류
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-200/95">
                      담당 영업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/80">
                  {companyProducts.map((row, idx) => (
                    <tr
                      key={row.id ?? idx}
                      className="transition-colors hover:bg-stone-50"
                    >
                      <td className="px-4 py-4 font-medium text-emerald-950">
                        {row.product_name_en?.trim() || "—"}
                      </td>
                      <td className="px-4 py-4 tabular-nums text-zinc-700">
                        {formatDateYmd(row.created_at ?? undefined)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-zinc-800 ring-1 ring-stone-200/80">
                          {paymentLabel(row)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-amber-100/80 px-2 py-0.5 text-xs font-semibold text-emerald-950 ring-1 ring-amber-300/50">
                          {bucketStatus(row)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-zinc-700">
                        {inciStatus(row)}
                      </td>
                      <td className="px-4 py-4 text-xs text-zinc-700">
                        {docStatus(row)}
                      </td>
                      <td className="px-4 py-4 text-zinc-700">
                        {row.recommender_name?.trim() || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
