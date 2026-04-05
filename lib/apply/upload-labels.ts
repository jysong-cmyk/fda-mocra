import { supabase } from "@/lib/supabase";

function sanitizeStorageFileName(name: string): string {
  const trimmed = name.trim();
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe.length > 0 ? safe : "image";
}

export async function uploadLabelFiles(files: File[]): Promise<string[]> {
  const labelImageUrls: string[] = [];
  const batchId =
    globalThis.crypto?.randomUUID?.() ??
    `b-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const unique = `${Date.now()}-${i}-${batchId}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 11)}`;
    const objectPath = `${unique}-${sanitizeStorageFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from("labels")
      .upload(objectPath, file, { cacheControl: "3600", upsert: false });

    if (uploadError != null) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from("labels")
      .getPublicUrl(objectPath);

    labelImageUrls.push(urlData.publicUrl);
  }
  return labelImageUrls;
}
