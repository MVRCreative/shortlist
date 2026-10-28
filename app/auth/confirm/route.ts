import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/digest";
  }
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const supabase = await createClient();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const error = code
    ? (await supabase.auth.exchangeCodeForSession(code)).error
    : tokenHash && type
      ? (await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error
      : new Error("missing token");

  if (!error) {
    return NextResponse.redirect(new URL(next, origin));
  }

  const fail = new URL("/login", origin);
  fail.searchParams.set("error", "link");
  return NextResponse.redirect(fail);
}
