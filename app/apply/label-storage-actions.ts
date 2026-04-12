"use server";
/* Vercel maxDuration: "use server" 모듈은 const export 불가 → app/apply/step3/page.tsx */

import { isValidApplySessionId } from "@/lib/apply/label-upload-shared";
import {
  APPLY_LABELS_BUCKET,
  parseLabelObjectPathsFromField,
} from "@/lib/apply/labels-storage";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type DeleteApplyCartLineResult = { error: string | null };

/**
 * 장바구니 줄 삭제: 클라이언트 세션과 일치하는 스토리지 경로만 정리한 뒤 products 행을 삭제합니다.
 */
export async function deleteApplyCartLineAction(input: {
  productId: string;
  sessionId: string;
}): Promise<DeleteApplyCartLineResult> {
  const sessionId = input.sessionId?.trim() ?? "";
  const productId = input.productId?.trim() ?? "";

  if (!isValidApplySessionId(sessionId)) {
    return { error: "유효하지 않은 세션입니다." };
  }
  if (productId === "") {
    return { error: "제품 ID가 없습니다." };
  }

  let admin;
  try {
    admin = createSupabaseAdmin();
  } catch (e) {
    console.error("[deleteApplyCartLineAction] admin client", e);
    return { error: "서버 설정 오류입니다. 관리자에게 문의해 주세요." };
  }

  const { data: row, error: fetchErr } = await admin
    .from("products")
    .select("id, label_image_url")
    .eq("id", productId)
    .maybeSingle();

  if (fetchErr != null) {
    return { error: fetchErr.message };
  }
  if (row == null) {
    return { error: "삭제할 제품을 찾을 수 없습니다." };
  }

  const paths = parseLabelObjectPathsFromField(
    typeof row.label_image_url === "string" ? row.label_image_url : "",
  );
  const prefix = `${sessionId}/`;
  const toRemove = paths.filter((p) => p.startsWith(prefix));

  if (toRemove.length > 0) {
    const { error: rmErr } = await admin.storage
      .from(APPLY_LABELS_BUCKET)
      .remove(toRemove);
    if (rmErr != null) {
      console.error(
        "[deleteApplyCartLineAction] storage remove failed (continuing with DB delete)",
        { productId, paths: toRemove, message: rmErr.message },
      );
    }
  }

  const { error: delErr } = await admin
    .from("products")
    .delete()
    .eq("id", productId);

  if (delErr != null) {
    return { error: delErr.message };
  }
  return { error: null };
}
