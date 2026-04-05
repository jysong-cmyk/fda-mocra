import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용. SUPABASE_SERVICE_ROLE_KEY 로 Storage·DB 작업 시 RLS를 우회합니다.
 * 클라이언트 번들에 절대 포함되지 않도록 이 모듈은 server action / route에서만 import 하세요.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url == null || url === "") {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }
  if (serviceKey == null || serviceKey === "") {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (server-only, never use NEXT_PUBLIC_).",
    );
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
