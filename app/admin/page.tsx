"use client";

import type { Session } from "@supabase/supabase-js";
import { AdminCsvExportButton } from "@/components/admin-csv-export-button";
import { AicraHeader } from "@/components/aicra-header";
import { DashboardFilterToolbar } from "@/components/dashboard-filter-toolbar";
import { DashboardTableSkeleton } from "@/components/dashboard-skeleton";
import { IconChevronRight } from "@/components/icon-chevron-right";
import { SortableTh } from "@/components/dashboard-sortable-th";
import { encodeDrilldownId } from "@/lib/dashboard-routes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type DateFieldMode,
  type SortDir,
  filterProductRows,
  groupProductsByCompany,
  summarizeBySalesRep,
  toggleSortDir,
} from "@/lib/dashboard-data";
import { ADMIN_EMAIL } from "@/lib/admin-constants";
import { supabase } from "@/lib/supabase";

const kb = "break-keep text-balance" as const;

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
  agent_name?: string | null;
  recommender_name?: string | null;
  status?: string | null;
  applicant_name?: string | null;
  applicant_phone?: string | null;
  applicant_email?: string | null;
  label_image_url?: string | null;
  paid_at?: string | null;
};

function isAllowedAdminSession(s: Session | null): boolean {
  return s?.user?.email === ADMIN_EMAIL;
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterSearch, setFilterSearch] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterDateField, setFilterDateField] =
    useState<DateFieldMode>("created");
  const [filterStatus, setFilterStatus] = useState("");
  const [adminTab, setAdminTab] = useState<"company" | "rep">("company");
  const [sortCompany, setSortCompany] = useState<{
    key: string;
    dir: SortDir;
  }>({ key: "applicant_name", dir: "asc" });
  const [sortRep, setSortRep] = useState<{ key: string; dir: SortDir }>({
    key: "name",
    dir: "asc",
  });

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAllowed = isAllowedAdminSession(session);
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAllowed) {
      setRows([]);
      setError(null);
    }
  }, [isLoading, isAllowed]);

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
      setLoading(false);
      return;
    }

    setRows((data as ProductRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading || !isAllowed) return;
    void load();
  }, [isLoading, isAllowed, load]);

  const filteredRows = useMemo(
    () =>
      filterProductRows(rows, {
        search: filterSearch,
        dateFrom: filterDateFrom,
        dateTo: filterDateTo,
        dateField: filterDateField,
        status: filterStatus,
      }),
    [
      rows,
      filterSearch,
      filterDateFrom,
      filterDateTo,
      filterDateField,
      filterStatus,
    ],
  );

  const companyGroups = useMemo(
    () => groupProductsByCompany(filteredRows),
    [filteredRows],
  );

  const repSummaries = useMemo(
    () => summarizeBySalesRep(filteredRows),
    [filteredRows],
  );

  const sortedCompanies = useMemo(() => {
    const m = sortCompany.dir === "asc" ? 1 : -1;
    return [...companyGroups].sort((a, b) => {
      switch (sortCompany.key) {
        case "applicant_email":
          return m * a.applicant_email.localeCompare(b.applicant_email, "ko");
        case "skuCount":
          return m * (a.skuCount - b.skuCount);
        case "status":
          return m * a.status.localeCompare(b.status, "ko");
        case "applicant_name":
        default:
          return m * a.applicant_name.localeCompare(b.applicant_name, "ko");
      }
    });
  }, [companyGroups, sortCompany]);

  const sortedReps = useMemo(() => {
    const m = sortRep.dir === "asc" ? 1 : -1;
    return [...repSummaries].sort((a, b) => {
      switch (sortRep.key) {
        case "companyCount":
          return m * (a.companyCount - b.companyCount);
        case "productCount":
          return m * (a.productCount - b.productCount);
        case "statusLabel":
          return m * a.statusLabel.localeCompare(b.statusLabel, "ko");
        case "name":
        default:
          return m * a.name.localeCompare(b.name, "ko");
      }
    });
  }, [repSummaries, sortRep]);

  function handleSortCompany(nextKey: string) {
    setSortCompany((prev) => {
      const n = toggleSortDir(prev.key, nextKey, prev.dir);
      return { key: n.key, dir: n.dir };
    });
  }

  function handleSortRep(nextKey: string) {
    setSortRep((prev) => {
      const n = toggleSortDir(prev.key, nextKey, prev.dir);
      return { key: n.key, dir: n.dir };
    });
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);
    setLoginPending(true);
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setLoginPending(false);
    if (signErr != null) {
      setLoginError(signErr.message);
      return;
    }
    setLoginPassword("");
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-stone-50 ${kb}`}>
        <AicraHeader page="admin" />
        <div className="flex items-center justify-center px-4 py-24">
          <p className="text-sm font-medium tracking-tight text-emerald-950/80">
            인증 확인 중...
          </p>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className={`min-h-screen bg-stone-50 ${kb}`}>
        <AicraHeader page="admin" />
        <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-amber-100 bg-white p-8 shadow-lg shadow-emerald-950/5">
          <h1 className="text-xl font-bold tracking-tight text-emerald-950">
            관리자 로그인
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            허용된 관리자 계정으로 로그인해 주세요.
          </p>
          {session != null ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
              현재 로그인한 계정({session.user.email})은 이 페이지에 접근할 수
              없습니다.
            </p>
          ) : null}
          <form className="mt-6 space-y-4" onSubmit={(e) => void handleLogin(e)}>
            <div>
              <label
                htmlFor="admin-login-email"
                className="mb-1 block text-xs font-medium text-zinc-700"
              >
                이메일
              </label>
              <input
                id="admin-login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                placeholder="이메일 주소"
                required
              />
            </div>
            <div>
              <label
                htmlFor="admin-login-password"
                className="mb-1 block text-xs font-medium text-zinc-700"
              >
                비밀번호
              </label>
              <input
                id="admin-login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                placeholder="비밀번호"
                required
              />
            </div>
            {loginError != null ? (
              <p className="text-sm text-red-600">{loginError}</p>
            ) : null}
            <button
              type="submit"
              disabled={loginPending}
              className="w-full cursor-pointer rounded-lg bg-emerald-950 py-2.5 text-sm font-semibold text-stone-50 transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginPending ? "로그인 중…" : "로그인"}
            </button>
          </form>
          {session != null ? (
            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className="mt-4 w-full cursor-pointer rounded-lg border border-zinc-300 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              로그아웃
            </button>
          ) : null}
          <Link
            href="/"
            className="mt-6 inline-block cursor-pointer text-sm font-medium text-emerald-900/80 hover:text-emerald-950"
          >
            ← 메인으로
          </Link>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-stone-50 ${kb}`}>
      <AicraHeader page="admin" />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-3 inline-block cursor-pointer text-sm font-medium text-emerald-900/75 hover:text-emerald-950"
            >
              ← 메인으로
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
              관리자 · 신청 내역
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
              {ADMIN_EMAIL} · 필터·정렬이 모든 요약·테이블에 동시 적용됩니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className="cursor-pointer rounded-lg border border-amber-200/60 bg-white px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition-colors hover:bg-stone-50"
            >
              로그아웃
            </button>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="shrink-0 cursor-pointer rounded-lg border border-emerald-950/20 bg-emerald-950 px-4 py-2 text-sm font-semibold text-stone-50 shadow-sm transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              새로고침
            </button>
          </div>
        </div>

        {loading ? (
          <DashboardTableSkeleton rows={8} />
        ) : error != null ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
            데이터를 불러오지 못했습니다: {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-amber-200/30 bg-white p-12 text-center text-sm text-zinc-500 shadow-sm">
            등록된 신청이 없습니다.
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-amber-200/30 bg-white p-5 shadow-sm shadow-emerald-950/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  필터 반영 제품 건수
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-amber-700">
                  {filteredRows.length}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200/30 bg-white p-5 shadow-sm shadow-emerald-950/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  고유 기업 수
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-800">
                  {companyGroups.length}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200/30 bg-white p-5 shadow-sm shadow-emerald-950/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  영업 담당자 수
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-950">
                  {repSummaries.length}
                </p>
              </div>
            </div>

            <DashboardFilterToolbar
              search={filterSearch}
              onSearchChange={setFilterSearch}
              dateField={filterDateField}
              onDateFieldChange={setFilterDateField}
              dateFrom={filterDateFrom}
              dateTo={filterDateTo}
              onDateFromChange={setFilterDateFrom}
              onDateToChange={setFilterDateTo}
              status={filterStatus}
              onStatusChange={setFilterStatus}
            />

            {filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-amber-200/30 bg-white p-10 text-center text-sm text-zinc-600 shadow-sm">
                조건에 맞는 신청이 없습니다. 필터를 조정해 보세요.
              </div>
            ) : (
              <>
                <div
                  className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-amber-200/40 bg-white p-1.5 shadow-sm shadow-emerald-950/5"
                  role="tablist"
                  aria-label="관리자 실적 보기"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={adminTab === "company"}
                    onClick={() => setAdminTab("company")}
                    className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                      adminTab === "company"
                        ? "bg-emerald-950 text-amber-100 shadow-sm"
                        : "text-emerald-950/80 hover:bg-stone-50"
                    }`}
                  >
                    기업별 실적
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={adminTab === "rep"}
                    onClick={() => setAdminTab("rep")}
                    className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                      adminTab === "rep"
                        ? "bg-emerald-950 text-amber-100 shadow-sm"
                        : "text-emerald-950/80 hover:bg-stone-50"
                    }`}
                  >
                    영업 담당자별 실적
                  </button>
                </div>

                {adminTab === "company" ? (
                  <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200/30 bg-white shadow-lg shadow-emerald-950/5">
                    <div className="border-b border-amber-200/40 bg-emerald-950/5 px-5 py-4">
                      <h2 className="text-base font-bold tracking-tight text-emerald-950">
                        기업별 실적
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                        행을 클릭하면 해당 기업의 SKU·결제·진행 상세로
                        이동합니다.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-amber-200/50 bg-emerald-950">
                            <SortableTh
                              label="기업명"
                              sortKey="applicant_name"
                              activeKey={sortCompany.key}
                              dir={sortCompany.dir}
                              onSort={handleSortCompany}
                              className="px-5 py-3.5"
                            />
                            <SortableTh
                              label="이메일"
                              sortKey="applicant_email"
                              activeKey={sortCompany.key}
                              dir={sortCompany.dir}
                              onSort={handleSortCompany}
                              className="px-5 py-3.5"
                            />
                            <th
                              scope="col"
                              className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-amber-100/95"
                            >
                              연락처
                            </th>
                            <SortableTh
                              label="SKU 수"
                              sortKey="skuCount"
                              activeKey={sortCompany.key}
                              dir={sortCompany.dir}
                              onSort={handleSortCompany}
                              className="w-28 px-5 py-3.5"
                            />
                            <SortableTh
                              label="진행 상황"
                              sortKey="status"
                              activeKey={sortCompany.key}
                              dir={sortCompany.dir}
                              onSort={handleSortCompany}
                              className="w-36 px-5 py-3.5"
                            />
                            <th
                              scope="col"
                              className="w-12 px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-amber-100/95"
                              aria-label="상세로 이동"
                            >
                              <span className="sr-only">상세</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100/80">
                          {sortedCompanies.map((g) => (
                            <tr
                              key={g.applicant_name}
                              role="link"
                              tabIndex={0}
                              className="cursor-pointer transition-colors hover:bg-stone-50"
                              onClick={() =>
                                router.push(
                                  `/admin/company/${encodeDrilldownId(g.applicant_name)}`,
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  router.push(
                                    `/admin/company/${encodeDrilldownId(g.applicant_name)}`,
                                  );
                                }
                              }}
                            >
                              <td className="px-5 py-4 font-medium text-emerald-950">
                                {g.applicant_name}
                              </td>
                              <td className="px-5 py-4 break-all text-zinc-700">
                                {g.applicant_email}
                              </td>
                              <td className="px-5 py-4 text-zinc-700">
                                {g.applicant_phone}
                              </td>
                              <td className="px-5 py-4 tabular-nums font-semibold text-amber-800">
                                {g.skuCount}
                              </td>
                              <td className="px-5 py-4">
                                <span className="inline-flex rounded-full bg-amber-100/80 px-2.5 py-1 text-xs font-semibold text-emerald-950 ring-1 ring-inset ring-amber-300/50">
                                  {g.status}
                                </span>
                              </td>
                              <td className="w-12 px-3 py-4 text-zinc-400">
                                <IconChevronRight
                                  className="h-5 w-5 shrink-0"
                                  aria-hidden
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200/30 bg-white shadow-lg shadow-emerald-950/5">
                    <div className="border-b border-amber-200/40 bg-emerald-950/5 px-5 py-4">
                      <h2 className="text-base font-bold tracking-tight text-emerald-950">
                        영업 담당자별 실적
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                        행을 클릭하면 담당 기업 목록·제품 현황 상세로 이동합니다.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-amber-200/50 bg-emerald-950">
                            <SortableTh
                              label="담당자명"
                              sortKey="name"
                              activeKey={sortRep.key}
                              dir={sortRep.dir}
                              onSort={handleSortRep}
                              className="px-5 py-3.5"
                            />
                            <SortableTh
                              label="담당 기업 수"
                              sortKey="companyCount"
                              activeKey={sortRep.key}
                              dir={sortRep.dir}
                              onSort={handleSortRep}
                              className="w-32 px-5 py-3.5"
                            />
                            <SortableTh
                              label="총 등록 건수"
                              sortKey="productCount"
                              activeKey={sortRep.key}
                              dir={sortRep.dir}
                              onSort={handleSortRep}
                              className="w-36 px-5 py-3.5"
                            />
                            <SortableTh
                              label="진행 상태 요약"
                              sortKey="statusLabel"
                              activeKey={sortRep.key}
                              dir={sortRep.dir}
                              onSort={handleSortRep}
                              className="min-w-[12rem] px-5 py-3.5"
                            />
                            <th
                              scope="col"
                              className="w-12 px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-amber-100/95"
                              aria-label="상세로 이동"
                            >
                              <span className="sr-only">상세</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100/80">
                          {sortedReps.map((r) => (
                            <tr
                              key={r.name}
                              role="link"
                              tabIndex={0}
                              className="cursor-pointer transition-colors hover:bg-stone-50"
                              onClick={() =>
                                router.push(
                                  `/admin/sales-rep/${encodeDrilldownId(r.name)}`,
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  router.push(
                                    `/admin/sales-rep/${encodeDrilldownId(r.name)}`,
                                  );
                                }
                              }}
                            >
                              <td className="px-5 py-4 font-semibold text-emerald-950">
                                {r.name}
                              </td>
                              <td className="px-5 py-4 tabular-nums text-zinc-800">
                                {r.companyCount}
                              </td>
                              <td className="px-5 py-4 tabular-nums font-medium text-amber-800">
                                {r.productCount}
                              </td>
                              <td className="px-5 py-4 text-xs leading-relaxed text-zinc-700">
                                {r.statusLabel}
                              </td>
                              <td className="w-12 px-3 py-4 text-zinc-400">
                                <IconChevronRight
                                  className="h-5 w-5 shrink-0"
                                  aria-hidden
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
        <AdminCsvExportButton />
      </div>
    </div>
  );
}
