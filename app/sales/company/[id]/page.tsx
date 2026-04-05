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

type SalesRepRow = {
  id: string;
  name: string;
  phone: string | null;
};

type ProductRow = {
  id?: string;
  created_at?: string | null;
  applicant_name?: string | null;
  applicant_email?: string | null;
  applicant_phone?: string | null;
  product_name_en?: string | null;
  recommender_name?: string | null;
  status?: string | null;
  ingredient_text?: string | null;
  category1?: string | null;
  category2?: string | null;
  category3?: string | null;
  fei_number?: string | null;
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
  return t != null && t !== "" ? "매핑 입력됨" : "입력 필요";
}

function categoryPath(row: ProductRow): string {
  const parts = [row.category1, row.category2, row.category3].filter(
    (x) => (x?.trim() ?? "") !== "",
  );
  return parts.length > 0 ? parts.join(" > ") : "—";
}

export default function SalesCompanyDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const idParam = Array.isArray(rawId) ? rawId[0] : rawId;

  const [session, setSession] = useState<Session | null>(null);
  const [authInitializing, setAuthInitializing] = useState(true);
  const [repProfile, setRepProfile] = useState<SalesRepRow | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyKey, setCompanyKey] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setAuthInitializing(false);
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
      setCompanyKey(decodeDrilldownId(decodeURIComponent(idParam)));
      setDecodeError(null);
    } catch {
      setDecodeError("기업 정보를 해석할 수 없습니다.");
      setCompanyKey(null);
    }
  }, [idParam]);

  const loadData = useCallback(async (userId: string, repNameNoSpace: string) => {
    setLoading(true);
    setError(null);
    const { data: repData, error: repErr } = await supabase
      .from("sales_representatives")
      .select("id, name, phone")
      .eq("id", userId)
      .maybeSingle();

    if (repErr != null || repData == null) {
      setError(repErr?.message ?? "프로필을 찾을 수 없습니다.");
      setRepProfile(null);
      setProducts([]);
      setLoading(false);
      return;
    }

    const rep = repData as SalesRepRow;
    setRepProfile(rep);

    const { data: prodData, error: prodErr } = await supabase
      .from("products")
      .select(
        "id, created_at, applicant_name, applicant_email, applicant_phone, product_name_en, recommender_name, status, ingredient_text, category1, category2, category3, fei_number",
      )
      .eq("recommender_name", repNameNoSpace);

    if (prodErr != null) {
      setError(prodErr.message);
      setProducts([]);
    } else {
      setProducts((prodData as ProductRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authInitializing || session == null || companyKey == null) {
      return;
    }
    const userId = session.user.id;
    void (async () => {
      const { data: repData } = await supabase
        .from("sales_representatives")
        .select("name")
        .eq("id", userId)
        .maybeSingle();
      const name = ((repData as { name?: string } | null)?.name ?? "").replace(
        /\s+/g,
        "",
      );
      if (name === "") {
        setError("영업 이름이 없습니다.");
        setLoading(false);
        return;
      }
      await loadData(userId, name);
    })();
  }, [authInitializing, session, companyKey, loadData]);

  const companyProducts = useMemo(() => {
    if (companyKey == null) return [];
    return products.filter(
      (r) => companyKeyFromApplicant(r.applicant_name) === companyKey,
    );
  }, [products, companyKey]);

  const headerContact = useMemo(() => {
    const first = companyProducts[0];
    if (first == null) return { email: "—", phone: "—" };
    return {
      email: first.applicant_email?.trim() || "—",
      phone: first.applicant_phone?.trim() || "—",
    };
  }, [companyProducts]);

  if (authInitializing) {
    return (
      <div className={`min-h-screen bg-stone-50 ${kb}`}>
        <AicraHeader page="sales" />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <DashboardCardSkeleton />
          <div className="mt-6">
            <DashboardTableSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (session == null) {
    return (
      <div className={`min-h-screen bg-stone-50 p-8 ${kb}`}>
        <AicraHeader page="sales" />
        <p className="text-center text-sm text-zinc-600">로그인이 필요합니다.</p>
        <DashboardBackLink href="/sales" />
      </div>
    );
  }

  if (decodeError != null || companyKey == null) {
    return (
      <div className={`min-h-screen bg-stone-50 ${kb}`}>
        <AicraHeader page="sales" />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <DashboardBackLink href="/sales" />
          <p className="mt-4 text-sm text-red-600">{decodeError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-stone-50 ${kb}`}>
      <AicraHeader page="sales" />
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6">
        <DashboardBackLink href="/sales" />
        <p className="mt-2 text-xs font-medium text-emerald-800">
          {repProfile?.name != null ? `${repProfile.name} 님 담당` : ""}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-emerald-950 sm:text-3xl">
          {companyKey}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {headerContact.email} · {headerContact.phone}
        </p>

        {loading ? (
          <div className="mt-8">
            <DashboardTableSkeleton rows={5} />
          </div>
        ) : error != null ? (
          <p className="mt-8 text-sm text-red-600">{error}</p>
        ) : companyProducts.length === 0 ? (
          <p className="mt-8 rounded-xl border border-amber-200/30 bg-white p-8 text-center text-sm text-zinc-500">
            이 기업에 대한 담당 제품이 없거나 접근할 수 없습니다.
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-amber-200/30 bg-white shadow-lg shadow-emerald-950/5">
            <div className="border-b border-amber-200/40 bg-emerald-950/5 px-5 py-4">
              <h2 className="text-base font-bold text-emerald-950">
                세부 실적 · SKU
              </h2>
              <p className="mt-1 text-xs text-zinc-600">
                등록·INCI·카테고리·서류 상태를 확인합니다.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className="border-b border-amber-200/50 bg-emerald-950">
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-100/95">
                      제품명(영문)
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-100/95">
                      접수일
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-100/95">
                      카테고리
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-100/95">
                      INCI
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-200/95">
                      서류·진행
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-amber-200/95">
                      FEI
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
                      <td className="max-w-[200px] px-4 py-4 text-xs leading-snug text-zinc-700">
                        {categoryPath(row)}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-zinc-800">
                        {inciStatus(row)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-amber-100/80 px-2 py-0.5 text-xs font-semibold text-emerald-950 ring-1 ring-amber-300/50">
                          {statusBadgeLabel(row)} · {bucketStatus(row)}
                        </span>
                      </td>
                      <td className="px-4 py-4 tabular-nums text-xs text-zinc-600">
                        {row.fei_number?.trim() || "—"}
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
