import { ADMIN_EMAIL } from "@/lib/admin-constants";
import { escapeCsvCell } from "@/lib/csv-escape";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { NextResponse } from "next/server";

const RPA_PRODUCT_SELECT =
  "id, created_at, product_name_en, fei_number, category1, category2, category3, ingredient_text, rp_name_en, rp_contact, applicant_name, applicant_phone, applicant_email, label_image_url, submission_status";

function rowsToCsv(
  headers: { key: string; label: string }[],
  rows: Record<string, unknown>[],
): string {
  const headerLine = headers.map((h) => escapeCsvCell(h.label)).join(",");
  const bodyLines = rows.map((row) =>
    headers.map((h) => escapeCsvCell(row[h.key])).join(","),
  );
  return [headerLine, ...bodyLines].join("\r\n");
}

const TARGET_LIST_COLUMNS: { key: string; label: string }[] = [
  { key: "id", label: "제품 ID" },
  { key: "applicant_name", label: "기업명(신청자)" },
  { key: "product_name_en", label: "제품명(영문)" },
  { key: "applicant_phone", label: "연락처(전화)" },
  { key: "applicant_email", label: "연락처(이메일)" },
  { key: "rp_name_en", label: "RP 영문명" },
  { key: "rp_contact", label: "RP 연락처" },
  { key: "fei_number", label: "FEI 번호" },
  { key: "category1", label: "카테고리(대)" },
  { key: "category2", label: "카테고리(중)" },
  { key: "category3", label: "카테고리(소)" },
  { key: "label_image_url", label: "라벨 이미지 URL" },
  { key: "created_at", label: "등록일시" },
];

const MOCRA_INGREDIENT_HEADER =
  'INGREDIENT UNII CODE(S),"COMMON, USUAL OR CHEMICAL NAME"';

/** DB `ingredient_text`를 쉼표·줄바꿈 기준으로 나누고 trim 후 빈 값 제거 */
function parseIngredientLines(raw: string | null | undefined): string[] {
  if (raw == null) return [];
  const s = String(raw);
  const parts = s.split(/[\n\r,]+/);
  const out: string[] = [];
  for (const p of parts) {
    const t = p.trim();
    if (t !== "") out.push(t);
  }
  return out;
}

function buildIngredientCsv(ingredientNames: string[]): string {
  const lines = [MOCRA_INGREDIENT_HEADER];
  for (const name of ingredientNames) {
    lines.push(`,${escapeCsvCell(name)}`);
  }
  return lines.join("\r\n");
}

/** ZIP·파일명에 쓸 수 있도록 제품명 일부만 정제 */
function sanitizeFileNamePart(raw: string, maxLen: number): string {
  const base = raw.trim() !== "" ? raw.trim() : "product";
  const cleaned = base
    .replace(/[\\/:*?"<>|#\r\n\t]/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, maxLen);
  return cleaned !== "" ? cleaned : "product";
}

function yyyymmdd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

type ProductRpaRow = Record<string, unknown>;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token =
    authHeader != null && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

  if (token === "") {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url == null || url === "" || anonKey == null || anonKey === "") {
    return NextResponse.json(
      { error: "서버 설정 오류입니다." },
      { status: 500 },
    );
  }

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userErr,
  } = await authClient.auth.getUser(token);

  if (userErr != null || user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  let admin;
  try {
    admin = createSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { error: "서버 설정 오류입니다." },
      { status: 500 },
    );
  }

  const { data: products, error: qErr } = await admin
    .from("products")
    .select(RPA_PRODUCT_SELECT)
    .eq("submission_status", "READY")
    .order("created_at", { ascending: true });

  if (qErr != null) {
    return NextResponse.json(
      { error: "데이터를 불러오지 못했습니다." },
      { status: 502 },
    );
  }

  const candidates = (products ?? []) as ProductRpaRow[];
  if (candidates.length === 0) {
    return NextResponse.json(
      { message: "다운로드할 신규 데이터(READY)가 없습니다." },
      { status: 400 },
    );
  }

  const candidateIds = candidates
    .map((r) => (r.id != null ? String(r.id).trim() : ""))
    .filter((id) => id !== "");

  if (candidateIds.length === 0) {
    return NextResponse.json(
      { message: "다운로드할 신규 데이터(READY)가 없습니다." },
      { status: 400 },
    );
  }

  const { data: claimed, error: claimErr } = await admin
    .from("products")
    .update({ submission_status: "PROCESSING" })
    .eq("submission_status", "READY")
    .in("id", candidateIds)
    .select(RPA_PRODUCT_SELECT);

  if (claimErr != null) {
    return NextResponse.json(
      { error: "상태를 갱신하지 못해보내기를 중단했습니다." },
      { status: 502 },
    );
  }

  const rows = (claimed ?? []) as ProductRpaRow[];
  if (rows.length === 0) {
    return NextResponse.json(
      {
        message:
          "다른 요청에서 이미 처리 중입니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 409 },
    );
  }

  const bom = "\uFEFF";
  const masterBody = rowsToCsv(TARGET_LIST_COLUMNS, rows);
  const masterCsv = bom + masterBody;

  const zip = new JSZip();
  zip.file("00_target_list.csv", masterCsv);

  for (const row of rows) {
    const id = row.id != null ? String(row.id) : "unknown";
    const productName =
      row.product_name_en != null ? String(row.product_name_en) : "";
    const ingredientRaw = row.ingredient_text as string | null | undefined;
    const names = parseIngredientLines(ingredientRaw);
    const ingredientCsv = bom + buildIngredientCsv(names);
    const safeName = sanitizeFileNamePart(productName, 48);
    const safeId = sanitizeFileNamePart(id, 36);
    zip.file(`ingredient_${safeName}_${safeId}.csv`, ingredientCsv);
  }

  const zipBuffer = await zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
  });

  const filename = `rpa_export_${yyyymmdd(new Date())}.zip`;

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
