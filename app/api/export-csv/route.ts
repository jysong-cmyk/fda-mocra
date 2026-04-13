import { ADMIN_EMAIL } from "@/lib/admin-constants";
import { escapeCsvCell } from "@/lib/csv-escape";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

const CSV_COLUMNS: { key: string; label: string }[] = [
  { key: "id", label: "제품 ID" },
  { key: "created_at", label: "등록일시" },
  { key: "product_name_en", label: "영문 제품명" },
  { key: "fei_number", label: "FEI 번호" },
  { key: "category1", label: "카테고리(대)" },
  { key: "category2", label: "카테고리(중)" },
  { key: "category3", label: "카테고리(소)" },
  { key: "ingredient_text", label: "성분표 텍스트" },
  { key: "rp_name_en", label: "RP 영문명" },
  { key: "rp_contact", label: "RP 연락처" },
  { key: "agent_name", label: "에이전트" },
  { key: "applicant_name", label: "신청자 이름" },
  { key: "applicant_phone", label: "신청자 전화" },
  { key: "applicant_email", label: "신청자 이메일" },
  { key: "recommender_name", label: "추천인" },
  { key: "label_image_url", label: "라벨 이미지 URL" },
  { key: "paid_at", label: "결제일시" },
  { key: "status", label: "진행 상태" },
  { key: "submission_status", label: "RPA 제출 상태" },
  { key: "registration_number", label: "FDA 등록 번호" },
  { key: "submitted_at", label: "제출 시각" },
  { key: "completed_at", label: "완료 시각" },
];

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
    .select(
      "id, created_at, product_name_en, fei_number, category1, category2, category3, ingredient_text, rp_name_en, rp_contact, agent_name, applicant_name, applicant_phone, applicant_email, recommender_name, label_image_url, paid_at, status, submission_status, registration_number, submitted_at, completed_at",
    )
    .order("created_at", { ascending: false });

  if (qErr != null) {
    return NextResponse.json(
      { error: "데이터를 불러오지 못했습니다." },
      { status: 502 },
    );
  }

  const rows = (products ?? []) as Record<string, unknown>[];
  const csvBody = rowsToCsv(CSV_COLUMNS, rows);
  const bom = "\uFEFF";
  const csv = bom + csvBody;

  const date = new Date().toISOString().slice(0, 10);
  const filename = `fda_mocra_data_${date}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
