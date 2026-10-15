import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/env";

/**
 * Cookie-less anon client for cacheable public reads. Because it never touches
 * cookies, pages using it can be statically rendered and revalidated on demand.
 * RLS still limits it to published content.
 */
export function createPublicClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createSupabaseClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
