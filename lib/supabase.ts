import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl == null || supabaseUrl === "") {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL. Set it in your environment (e.g. .env.local).",
  );
}

if (supabaseAnonKey == null || supabaseAnonKey === "") {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Set it in your environment (e.g. .env.local).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
