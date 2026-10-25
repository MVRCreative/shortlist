import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/lib/supabase/database.types";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { getServerEnv } from "@/lib/env";

/** Request-scoped Supabase client. Reads the signed-in user from cookies. */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getPublicSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. Middleware refreshes the session.
        }
      },
    },
  });
}

/** Service-role client for trusted server jobs only. Never expose to the browser. */
export function createServiceRoleClient() {
  const env = getServerEnv();
  return createServiceClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
