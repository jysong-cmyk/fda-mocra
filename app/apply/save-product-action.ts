"use server";
/* Vercel maxDuration: "use server" 모듈은 const export 불가 → app/apply/step2/page.tsx */

import {
  isValidApplySessionId,
  sanitizeLabelStorageFileName,
  validateLabelFilesForUpload,
} from "@/lib/apply/label-upload-shared";
import {
  APPLY_LABELS_BUCKET,
  parseLabelObjectPathsFromField,
} from "@/lib/apply/labels-storage";
import {
  APPLY_SAVE_PRODUCT_FIELD,
  readApplyProductFormStrings,
  validateApplyProductFormServer,
} from "@/lib/apply/save-product-server-validation";
import type { CartLine } from "@/lib/apply/types-and-constants";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SaveApplyProductResult =
  | { ok: true; mode: "add" | "edit"; cartLine: CartLine }
  | { ok: false; error: string };

async function uploadLabelFilesWithRollback(
  admin: SupabaseClient,
  sessionId: string,
  files: File[],
): Promise<
  { urls: string[]; objectPaths: string[] } | { error: string }
> {
  const sid = sessionId.trim();
  const uploaded: string[] = [];
  const urls: string[] = [];
  const batchId =
    globalThis.crypto?.randomUUID?.() ??
    `b-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const unique = `${Date.now()}-${i}-${batchId}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 11)}`;
      const objectPath = `${sid}/${unique}-${sanitizeLabelStorageFileName(file.name)}`;
      const body = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await admin.storage
        .from(APPLY_LABELS_BUCKET)
        .upload(objectPath, body, {
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
          upsert: false,
        });
      if (upErr != null) {
        throw new Error(upErr.message || "스토리지 업로드에 실패했습니다.");
      }
      uploaded.push(objectPath);
      const { data: pub } = admin.storage
        .from(APPLY_LABELS_BUCKET)
        .getPublicUrl(objectPath);
      urls.push(pub.publicUrl);
    }
    return { urls, objectPaths: uploaded };
  } catch (e) {
    if (uploaded.length > 0) {
      await admin.storage.from(APPLY_LABELS_BUCKET).remove(uploaded);
    }
    return {
      error:
        e instanceof Error
          ? e.message
          : "라벨 이미지 업로드에 실패했습니다.",
    };
  }
}

/**
 * Step2 제품 신규 등록·수정: 서버에서 라벨 업로드 후 DB 저장까지 한 흐름.
 * DB 실패 시 이번에 올린 스토리지 객체만 롤백합니다.
 */
export async function saveApplyProductAction(
  formData: FormData,
): Promise<SaveApplyProductResult> {
  const F = APPLY_SAVE_PRODUCT_FIELD;
  const sessionRaw = formData.get(F.sessionId);
  const sessionId =
    typeof sessionRaw === "string"
      ? sessionRaw.trim()
      : String(sessionRaw ?? "").trim();
  if (!isValidApplySessionId(sessionId)) {
    return { ok: false, error: "유효하지 않은 세션입니다." };
  }

  const editingRaw = formData.get(F.editingId);
  const editingId =
    typeof editingRaw === "string"
      ? editingRaw.trim()
      : String(editingRaw ?? "").trim();
  const isInsert = editingId === "";

  const labelFiles = formData
    .getAll(F.labels)
    .filter((v): v is File => v instanceof File);

  let admin: SupabaseClient;
  try {
    admin = createSupabaseAdmin();
  } catch {
    return {
      ok: false,
      error: "서버 설정 오류입니다. 관리자에게 문의해 주세요.",
    };
  }

  if (!isInsert) {
    const { data: existing, error: exErr } = await admin
      .from("products")
      .select("id, session_id, label_image_url")
      .eq("id", editingId)
      .maybeSingle();

    if (exErr != null) {
      return { ok: false, error: exErr.message };
    }
    if (existing == null) {
      return { ok: false, error: "수정 대상 제품을 찾을 수 없습니다." };
    }

    const rowSession =
      existing.session_id == null ? "" : String(existing.session_id).trim();
    if (rowSession !== sessionId) {
      return {
        ok: false,
        error: "이 세션에서 등록한 제품만 수정할 수 있습니다.",
      };
    }

    const existingLabels =
      typeof existing.label_image_url === "string"
        ? existing.label_image_url.trim()
        : "";

    const editValidation = validateApplyProductFormServer(
      readApplyProductFormStrings(formData),
      {
        isInsert: false,
        labelFileCount: labelFiles.length,
        hasExistingLabelUrls: existingLabels !== "",
        hasIngredientImageMeta: true,
      },
    );
    if (!editValidation.ok) {
      return { ok: false, error: editValidation.error };
    }
    const p = editValidation.payload;

    const hasNewLabels = labelFiles.length > 0;
    let labelImageUrlFinal = existingLabels;
    let newPaths: string[] = [];

    if (hasNewLabels) {
      const fe = validateLabelFilesForUpload(labelFiles);
      if (fe != null) {
        return { ok: false, error: fe };
      }
      const up = await uploadLabelFilesWithRollback(
        admin,
        sessionId,
        labelFiles,
      );
      if ("error" in up) {
        return { ok: false, error: up.error };
      }
      newPaths = up.objectPaths;
      labelImageUrlFinal = up.urls.join(", ");
    }

    const { error: updateErr } = await admin
      .from("products")
      .update({
        rp_name_en: p.rpNameEn,
        rp_contact: p.rpContact,
        product_name_en: p.productNameEn,
        fei_number: p.feiNumber,
        category1: p.category1,
        category2: p.category2,
        category3: p.category3,
        ingredient_text: p.ingredientText,
        agent_name: p.agentName,
        applicant_name: p.applicantName,
        applicant_phone: p.applicantPhone,
        applicant_email: p.applicantEmail,
        recommender_name: p.recommenderName,
        label_image_url: labelImageUrlFinal,
        payment_status: "pending",
      })
      .eq("id", editingId)
      .eq("session_id", sessionId);

    if (updateErr != null) {
      if (newPaths.length > 0) {
        await admin.storage.from(APPLY_LABELS_BUCKET).remove(newPaths);
      }
      return { ok: false, error: updateErr.message };
    }

    if (hasNewLabels && existingLabels !== "") {
      const oldPaths = parseLabelObjectPathsFromField(existingLabels).filter(
        (path) => path.startsWith(`${sessionId}/`),
      );
      const newParsed = parseLabelObjectPathsFromField(labelImageUrlFinal);
      const toRemove = oldPaths.filter((path) => !newParsed.includes(path));
      if (toRemove.length > 0) {
        const { error: rmOldErr } = await admin.storage
          .from(APPLY_LABELS_BUCKET)
          .remove(toRemove);
        if (rmOldErr != null) {
          console.error(
            "[saveApplyProductAction] old label cleanup",
            rmOldErr.message,
          );
        }
      }
    }

    const cartLine: CartLine = {
      id: editingId,
      sessionId,
      productNameEn: p.productNameEn,
      category1: p.category1,
      category2: p.category2,
      category3: p.category3,
      feiNumber: p.feiNumber,
      ingredientText: p.ingredientText,
      labelImageUrl: labelImageUrlFinal,
      rpNameEn: p.rpNameEn,
      rpContact: p.rpContact,
      agentName: p.agentName,
      applicantName: p.applicantName,
      applicantPhone: p.applicantPhone,
      applicantEmail: p.applicantEmail,
    };
    return { ok: true, mode: "edit", cartLine };
  }

  const hasIngredientImageMeta =
    formData.get(F.hasIngredientImage) === "1";

  const insertValidation = validateApplyProductFormServer(
    readApplyProductFormStrings(formData),
    {
      isInsert: true,
      labelFileCount: labelFiles.length,
      hasExistingLabelUrls: false,
      hasIngredientImageMeta,
    },
  );
  if (!insertValidation.ok) {
    return { ok: false, error: insertValidation.error };
  }
  const p = insertValidation.payload;

  const fe = validateLabelFilesForUpload(labelFiles);
  if (fe != null) {
    return { ok: false, error: fe };
  }

  const up = await uploadLabelFilesWithRollback(admin, sessionId, labelFiles);
  if ("error" in up) {
    return { ok: false, error: up.error };
  }
  const labelUrlStr = up.urls.join(", ");

  const { data: inserted, error: insertErr } = await admin
    .from("products")
    .insert({
      rp_name_en: p.rpNameEn,
      rp_contact: p.rpContact,
      product_name_en: p.productNameEn,
      fei_number: p.feiNumber,
      category1: p.category1,
      category2: p.category2,
      category3: p.category3,
      ingredient_text: p.ingredientText,
      agent_name: p.agentName,
      applicant_name: p.applicantName,
      applicant_phone: p.applicantPhone,
      applicant_email: p.applicantEmail,
      recommender_name: p.recommenderName,
      label_image_url: labelUrlStr,
      payment_status: "pending",
      session_id: sessionId,
    })
    .select("id")
    .single();

  if (insertErr != null) {
    await admin.storage.from(APPLY_LABELS_BUCKET).remove(up.objectPaths);
    return { ok: false, error: insertErr.message };
  }
  if (inserted?.id == null || inserted.id === "") {
    await admin.storage.from(APPLY_LABELS_BUCKET).remove(up.objectPaths);
    return {
      ok: false,
      error: "저장 후 제품 ID를 받지 못했습니다. 설정을 확인해 주세요.",
    };
  }

  const cartLine: CartLine = {
    id: inserted.id,
    sessionId,
    productNameEn: p.productNameEn,
    category1: p.category1,
    category2: p.category2,
    category3: p.category3,
    feiNumber: p.feiNumber,
    ingredientText: p.ingredientText,
    labelImageUrl: labelUrlStr,
    rpNameEn: p.rpNameEn,
    rpContact: p.rpContact,
    agentName: p.agentName,
    applicantName: p.applicantName,
    applicantPhone: p.applicantPhone,
    applicantEmail: p.applicantEmail,
  };
  return { ok: true, mode: "add", cartLine };
}
