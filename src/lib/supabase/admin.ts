import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — server-only, bypasses RLS. Never import this from
// client components. Used for admin-dashboard reads/writes (verification
// queue, user management, audit log) where the admin's own RLS grants are
// intentionally minimal. Not parameterized with our Database type — see
// src/lib/supabase/client.ts.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
