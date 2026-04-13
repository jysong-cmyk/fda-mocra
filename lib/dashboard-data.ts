/** 관리자·영업 대시보드 공통 데이터 처리 */

export const PRODUCT_SUBMISSION_STATUSES = [
  "READY",
  "PROCESSING",
  "SUBMITTED",
  "COMPLETED",
  "ERROR",
] as const;

export type ProductSubmissionStatus =
  (typeof PRODUCT_SUBMISSION_STATUSES)[number];

export type ProductRowBase = {
  id?: string;
  created_at?: string | null;
  applicant_name?: string | null;
  applicant_email?: string | null;
  applicant_phone?: string | null;
  product_name_en?: string | null;
  recommender_name?: string | null;
  status?: string | null;
  /** 스키마에 없으면 undefined — 결제일 필터 시 접수일로 대체 */
  paid_at?: string | null;
  /** FDA / RPA 파이프라인 제출 상태 */
  submission_status?: string | null;
  registration_number?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
};

export type CompanyGroup = {
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  skuCount: number;
  status: string;
};

export type RepSummary = {
  name: string;
  companyCount: number;
  productCount: number;
  pendingCount: number;
  inProgressCount: number;
  doneCount: number;
  statusLabel: string;
};

export const STATUS_FILTER_ALL = "";
export const STATUS_OPTIONS = [
  { value: STATUS_FILTER_ALL, label: "전체 상태" },
  { value: "결제 대기", label: "결제 대기" },
  { value: "진행 중", label: "진행 중" },
  { value: "완료", label: "완료" },
] as const;

export type DateFieldMode = "created" | "paid";

export function statusBadgeLabel(row: ProductRowBase): string {
  const s = row.status?.trim();
  return s != null && s !== "" ? s : "접수 완료";
}

/** 필터·요약용 상태 버킷 */
export function bucketStatus(row: ProductRowBase): "결제 대기" | "진행 중" | "완료" {
  const t = statusBadgeLabel(row);
  if (/완료/i.test(t) && !/접수\s*완료/i.test(t)) return "완료";
  if (/진행/i.test(t)) return "진행 중";
  return "결제 대기";
}

function startOfDayMs(isoDate: string): number {
  const d = new Date(isoDate + "T00:00:00");
  return d.getTime();
}

function endOfDayMs(isoDate: string): number {
  const d = new Date(isoDate + "T23:59:59.999");
  return d.getTime();
}

export function getRowDateMs(
  row: ProductRowBase,
  mode: DateFieldMode,
): number | null {
  const raw =
    mode === "paid"
      ? (row.paid_at?.trim() ? row.paid_at : row.created_at)
      : row.created_at;
  if (raw == null || raw === "") return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}

export type RowFilters = {
  search: string;
  dateFrom: string;
  dateTo: string;
  dateField: DateFieldMode;
  status: string;
};

export function filterProductRows<T extends ProductRowBase>(
  rows: T[],
  f: RowFilters,
): T[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (q !== "") {
      const company = (r.applicant_name ?? "").toLowerCase();
      const rep = (r.recommender_name ?? "").toLowerCase();
      if (!company.includes(q) && !rep.includes(q)) return false;
    }
    const t = getRowDateMs(r, f.dateField);
    if (f.dateFrom !== "" && t != null && t < startOfDayMs(f.dateFrom)) {
      return false;
    }
    if (f.dateFrom !== "" && t == null) return false;
    if (f.dateTo !== "" && t != null && t > endOfDayMs(f.dateTo)) {
      return false;
    }
    if (f.dateTo !== "" && t == null) return false;
    if (f.status !== "" && bucketStatus(r) !== f.status) return false;
    return true;
  });
}

export function groupProductsByCompany(products: ProductRowBase[]): CompanyGroup[] {
  const map = new Map<
    string,
    {
      applicant_name: string;
      applicant_email: string;
      applicant_phone: string;
      skuCount: number;
      buckets: Set<string>;
    }
  >();

  for (const p of products) {
    const rawName = p.applicant_name?.trim() ?? "";
    const key = rawName !== "" ? rawName : "(기업명 미입력)";
    const b = bucketStatus(p);
    const existing = map.get(key);
    if (existing == null) {
      map.set(key, {
        applicant_name: key,
        applicant_email: p.applicant_email?.trim() ?? "—",
        applicant_phone: p.applicant_phone?.trim() ?? "—",
        skuCount: 1,
        buckets: new Set([b]),
      });
    } else {
      existing.skuCount += 1;
      existing.buckets.add(b);
      if (
        (existing.applicant_email === "—" || existing.applicant_email === "") &&
        (p.applicant_email?.trim() ?? "") !== ""
      ) {
        existing.applicant_email = p.applicant_email!.trim();
      }
      if (
        (existing.applicant_phone === "—" || existing.applicant_phone === "") &&
        (p.applicant_phone?.trim() ?? "") !== ""
      ) {
        existing.applicant_phone = p.applicant_phone!.trim();
      }
    }
  }

  return Array.from(map.values()).map((v) => {
    let status: string;
    if (v.buckets.size === 1) {
      status = [...v.buckets][0]!;
    } else if (v.buckets.size === 0) {
      status = "—";
    } else {
      status = "혼합";
    }
    return {
      applicant_name: v.applicant_name,
      applicant_email: v.applicant_email,
      applicant_phone: v.applicant_phone,
      skuCount: v.skuCount,
      status,
    };
  });
}

export function summarizeBySalesRep(rows: ProductRowBase[]): RepSummary[] {
  const map = new Map<
    string,
    { companies: Set<string>; rows: ProductRowBase[] }
  >();

  for (const r of rows) {
    const raw = r.recommender_name?.trim() ?? "";
    const name = raw !== "" ? raw : "(미지정)";
    let g = map.get(name);
    if (g == null) {
      g = { companies: new Set(), rows: [] };
      map.set(name, g);
    }
    g.rows.push(r);
    const co = r.applicant_name?.trim() ?? "";
    g.companies.add(co !== "" ? co : "(기업명 미입력)");
  }

  const out: RepSummary[] = [];
  for (const [name, g] of map) {
    let pending = 0;
    let prog = 0;
    let done = 0;
    for (const r of g.rows) {
      const b = bucketStatus(r);
      if (b === "결제 대기") pending += 1;
      else if (b === "진행 중") prog += 1;
      else done += 1;
    }
    const parts: string[] = [];
    if (pending > 0) parts.push(`결제 대기 ${pending}`);
    if (prog > 0) parts.push(`진행 ${prog}`);
    if (done > 0) parts.push(`완료 ${done}`);
    const statusLabel = parts.length > 0 ? parts.join(" · ") : "—";
    out.push({
      name,
      companyCount: g.companies.size,
      productCount: g.rows.length,
      pendingCount: pending,
      inProgressCount: prog,
      doneCount: done,
      statusLabel,
    });
  }

  return out.sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export type SortDir = "asc" | "desc";

export function toggleSortDir(
  currentKey: string,
  key: string,
  dir: SortDir,
): { key: string; dir: SortDir } {
  if (currentKey !== key) return { key, dir: "asc" };
  return { key, dir: dir === "asc" ? "desc" : "asc" };
}
