import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  let url: string;
  let anonKey: string;
  try {
    const env = getPublicSupabaseEnv();
    url = env.url;
    anonKey = env.publishableKey;
  } catch {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage =
    path === "/login" || path === "/signup" || path === "/forgot-password";
  const isProtected =
    path.startsWith("/digest") || path.startsWith("/onboarding");

  if (!user && path.startsWith("/auth/update-password")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/forgot-password";
    redirectUrl.search = "?error=expired";
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/digest";
    redirectUrl.searchParams.delete("next");
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
