import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

export function getSupabaseAdmin() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) return null;
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
