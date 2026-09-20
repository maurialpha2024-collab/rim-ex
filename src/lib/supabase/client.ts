import { createBrowserClient } from "@supabase/ssr";

// Not parameterized with our Database type: the installed supabase-js version's
// generic schema typing doesn't play well with hand-written Database types
// (see src/lib/database.types.ts). Row shapes are cast explicitly at call
// sites using those types instead.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
