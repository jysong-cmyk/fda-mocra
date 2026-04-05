"use client";

import type { Session } from "@supabase/supabase-js";
import { AicraHeader } from "@/components/aicra-header";
import { DashboardFilterToolbar } from "@/components/dashboard-filter-toolbar";
import { DashboardTableSkeleton } from "@/components/dashboard-skeleton";
import { IconChevronRight } from "@/components/icon-chevron-right";
import { SortableTh } from "@/components/dashboard-sortable-th";
import {
  bucketStatus,
  filterProductRows,
  groupProductsByCompany,
  toggleSortDir,
  type DateFieldMode,
  type SortDir,
} from "@/lib/dashboard-data";
import { encodeDrilldownId } from "@/lib/dashboard-routes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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
};

export default function SalesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authInitializing, setAuthInitializing] = useState(true);

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const [repProfile, setRepProfile] = useState<SalesRepRow | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [filterSearch, setFilterSearch] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterDateField, setFilterDateField] =
    useState<DateFieldMode>("created");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortCompany, setSortCompany] = useState<{
    key: string;
    dir: SortDir;
  }>({ key: "applicant_name", dir: "asc" });
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setAuthInitializing(false);
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

  const ensureSalesRepRow = useCallback(async (sess: Session) => {
    const userId = sess.user.id;
    const { data: existing, error: selErr } = await supabase
      .from("sales_representatives")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (selErr != null || existing != null) {
      return;
    }

    const meta = sess.user.user_metadata as Record<string, unknown> | undefined;
    const rawName = typeof meta?.name === "string" ? meta.name : "";
    const metaName = rawName.replace(/\s+/g, "");
    const rawPhone = typeof meta?.phone === "string" ? meta.phone : "";
    const metaPhone = rawPhone.trim();

    if (metaName === "") {
      return;
    }

    await supabase.from("sales_representatives").insert({
      id: userId,
      name: metaName,
      phone: metaPhone !== "" ? metaPhone : null,
    });
  }, []);

  const loadDashboard = useCallback(async (userId: string) => {
    setDashboardLoading(true);
    setDashboardError(null);
    setRepProfile(null);
    setProducts([]);

    const { data: repData, error: repErr } = await supabase
      .from("sales_representatives")
      .select("id, name, phone")
      .eq("id", userId)
      .maybeSingle();

    if (repErr != null) {
      setDashboardError(repErr.message);
      setDashboardLoading(false);
      return;
    }

    if (repData == null) {
      setDashboardError(
        "영업 프로필을 찾을 수 없습니다. 가입 시 입력한 이름이 user_metadata에 없거나 관리자에게 문의해 주세요.",
      );
      setDashboardLoading(false);
      return;
    }

    const rep = repData as SalesRepRow;
    setRepProfile(rep);

    const repName = (rep.name ?? "").replace(/\s+/g, "");
    if (repName === "") {
      setDashboardError("등록된 영업 이름이 없어 실적을 불러올 수 없습니다.");
      setDashboardLoading(false);
      return;
    }

    const { data: prodData, error: prodErr } = await supabase
      .from("products")
      .select(
        "id, created_at, applicant_name, applicant_email, applicant_phone, product_name_en, recommender_name, status",
      )
      .eq("recommender_name", repName);

    if (prodErr != null) {
      setDashboardError(prodErr.message);
      setDashboardLoading(false);
      return;
    }

    setProducts((prodData as ProductRow[]) ?? []);
    setDashboardLoading(false);
  }, []);

  useEffect(() => {
    if (authInitializing || session == null || session.user.id == null) {
      setRepProfile(null);
      setProducts([]);
      setDashboardError(null);
      return;
    }
    void (async () => {
      await ensureSalesRepRow(session);
      await loadDashboard(session.user.id);
    })();
  }, [authInitializing, session, ensureSalesRepRow, loadDashboard]);

  const filteredProducts = useMemo(
    () =>
      filterProductRows(products, {
        search: filterSearch,
        dateFrom: filterDateFrom,
        dateTo: filterDateTo,
        dateField: filterDateField,
        status: filterStatus,
      }),
    [
      products,
      filterSearch,
      filterDateFrom,
      filterDateTo,
      filterDateField,
      filterStatus,
    ],
  );

  const groups = useMemo(
    () => groupProductsByCompany(filteredProducts),
    [filteredProducts],
  );

  const sortedGroups = useMemo(() => {
    const m = sortCompany.dir === "asc" ? 1 : -1;
    return [...groups].sort((a, b) => {
      switch (sortCompany.key) {
        case "applicant_email":
          return m * a.applicant_email.localeCompare(b.applicant_email, "ko");
        case "skuCount":
          return m * (a.skuCount - b.skuCount);
        case "status":
          return m * a.status.localeCompare(b.status, "ko");
        default:
          return m * a.applicant_name.localeCompare(b.applicant_name, "ko");
      }
    });
  }, [groups, sortCompany]);

  const statusBreakdown = useMemo(() => {
    let pending = 0;
    let progress = 0;
    let done = 0;
    for (const r of filteredProducts) {
      const b = bucketStatus(r);
      if (b === "결제 대기") pending += 1;
      else if (b === "진행 중") progress += 1;
      else done += 1;
    }
    return { pending, progress, done };
  }, [filteredProducts]);

  function handleSortCompany(nextKey: string) {
    setSortCompany((prev) => {
      const n = toggleSortDir(prev.key, nextKey, prev.dir);
      return { key: n.key, dir: n.dir };
    });
  }

  const totalSkus = filteredProducts.length;
  const totalCompanies = groups.length;

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setAuthPending(true);
    const nameNoSpace = name.replace(/\s+/g, "");
    const trimmedPhone = phone.trim();
    if (nameNoSpace === "" || trimmedPhone === "") {
      setAuthError("이름과 연락처를 입력해 주세요.");
      setAuthPending(false);
      return;
    }

    const { error: signErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: nameNoSpace,
          phone: trimmedPhone,
        },
      },
    });

    if (signErr != null) {
      setAuthError(signErr.message);
      setAuthPending(false);
      return;
    }

    setAuthMessage(
      "입력하신 이메일로 인증 메일이 발송되었습니다. 메일 확인 후 로그인해 주세요.",
    );
    setIsSignUpMode(false);
    setPassword("");
    setAuthPending(false);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setAuthPending(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setAuthPending(false);
    if (signInErr != null) {
      setAuthError(signInErr.message);
      return;
    }
    setPassword("");
  }

  if (authInitializing) {
    return (
      <div className={`min-h-screen bg-stone-50 ${kb}`}>
        <AicraHeader page="sales" />
        <div className="flex items-center justify-center px-4 py-24">
          <p className="text-sm font-medium text-emerald-950/80">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (session == null) {
    return (
      <div className={`min-h-screen bg-stone-50 ${kb}`}>
        <AicraHeader page="sales" />
        <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-amber-100 bg-white p-8 shadow-lg shadow-emerald-950/5">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold tracking-tight text-emerald-950">
              영업 담당자 {isSignUpMode ? "회원가입" : "로그인"}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              추천 실적 및 고객 현황을 확인합니다.
            </p>
          </div>

          <form
            onSubmit={(e) =>
              isSignUpMode ? void handleSignUp(e) : void handleSignIn(e)
            }
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="sales-email"
                className="mb-1 block text-xs font-medium text-zinc-700"
              >
                이메일
              </label>
              <input
                id="sales-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-amber-400/20"
                required
              />
            </div>
            <div>
              <label
                htmlFor="sales-password"
                className="mb-1 block text-xs font-medium text-zinc-700"
              >
                비밀번호
              </label>
              <input
                id="sales-password"
                type="password"
                autoComplete={isSignUpMode ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-amber-400/20"
                required
                minLength={6}
              />
            </div>
            {isSignUpMode ? (
              <>
                <div>
                  <label
                    htmlFor="sales-name"
                    className="mb-1 block text-xs font-medium text-zinc-700"
                  >
                    이름
                  </label>
                  <input
                    id="sales-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-amber-400/20"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="sales-phone"
                    className="mb-1 block text-xs font-medium text-zinc-700"
                  >
                    연락처
                  </label>
                  <input
                    id="sales-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-amber-400/20"
                    required
                  />
                </div>
              </>
            ) : null}

            {authError != null ? (
              <p className="text-sm text-red-600">{authError}</p>
            ) : null}
            {authMessage != null ? (
              <p className="text-sm text-emerald-800">{authMessage}</p>
            ) : null}

            <button
              type="submit"
              disabled={authPending}
              className="w-full rounded-xl bg-emerald-950 py-3 text-sm font-semibold text-stone-50 shadow-sm transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authPending
                ? "처리 중..."
                : isSignUpMode
                  ? "가입하기"
                  : "로그인"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setIsSignUpMode((m) => !m);
              setAuthError(null);
              setAuthMessage(null);
            }}
            className="mt-6 w-full text-center text-sm font-medium text-emerald-800 hover:text-emerald-950"
          >
            {isSignUpMode
              ? "이미 계정이 있으신가요? 로그인"
              : "계정이 없으신가요? 가입하기"}
          </button>

          <Link
            href="/"
            className="mt-6 block text-center text-sm font-medium text-emerald-900/75 hover:text-emerald-950"
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
      <AicraHeader page="sales" />
      <div className="border-b border-amber-100/80 bg-white/90 px-4 py-5 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-emerald-950 sm:text-2xl">
              영업 대시보드
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              {repProfile?.name != null && repProfile.name !== ""
                ? `${repProfile.name} 님 · 추천인 실적`
                : "프로필 로딩 중..."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadDashboard(session.user.id)}
              disabled={dashboardLoading}
              className="rounded-lg border border-emerald-950/20 bg-emerald-950 px-4 py-2 text-sm font-semibold text-stone-50 hover:bg-emerald-900 disabled:opacity-50"
            >
              새로고침
            </button>
            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className="rounded-lg border border-amber-200/60 bg-white px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-stone-50"
            >
              로그아웃
            </button>
            <Link
              href="/"
              className="rounded-lg border border-amber-200/60 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-stone-50"
            >
              메인
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {dashboardLoading ? (
          <DashboardTableSkeleton rows={8} />
        ) : dashboardError != null ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800">
            {dashboardError}
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-amber-200/30 bg-white p-5 shadow-sm shadow-emerald-950/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  연결 기업 수 (필터 반영)
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-amber-700">
                  {totalCompanies}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200/30 bg-white p-5 shadow-sm shadow-emerald-950/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  총 제품(SKU) 건수
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-800">
                  {totalSkus}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200/30 bg-white p-5 shadow-sm shadow-emerald-950/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  진행 상태 요약
                </p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-900">
                  결제 대기 {statusBreakdown.pending} · 진행{" "}
                  {statusBreakdown.progress} · 완료 {statusBreakdown.done}
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

            {products.length === 0 ? (
              <div className="rounded-2xl border border-amber-200/30 bg-white p-12 text-center text-sm text-zinc-500 shadow-sm">
                아직 연결된 신청이 없습니다.
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-amber-200/30 bg-white p-10 text-center text-sm text-zinc-600 shadow-sm">
                조건에 맞는 신청이 없습니다. 필터를 조정해 보세요.
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-amber-200/30 bg-white shadow-lg shadow-emerald-950/5">
                  <div className="border-b border-amber-200/40 bg-emerald-950/5 px-5 py-4">
                    <h2 className="text-base font-bold tracking-tight text-emerald-950">
                      기업별 실적
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                      고객 폼의 추천인 이름과 일치하는 신청만 표시됩니다. 행을
                      클릭하면 해당 기업의 SKU·INCI·서류 상세로 이동합니다.
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
                        {sortedGroups.map((g) => (
                          <tr
                            key={g.applicant_name}
                            role="link"
                            tabIndex={0}
                            className="cursor-pointer transition-colors hover:bg-stone-50"
                            onClick={() =>
                              router.push(
                                `/sales/company/${encodeDrilldownId(g.applicant_name)}`,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                router.push(
                                  `/sales/company/${encodeDrilldownId(g.applicant_name)}`,
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
                              <IconChevronRight className="h-5 w-5 shrink-0" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
