"use server";

import { redirect } from "next/navigation";
import { ensureMemberAccount } from "@/lib/shortlist/bootstrap-account";
import { loadDigestForUser } from "@/lib/shortlist/load-digest";
import type { Digest } from "@/lib/shortlist/schemas";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type AuthResult =
  | { ok: true }
  | { ok: false; error: string };

async function confirmAndSignIn(
  email: string,
  password: string,
  userId: string,
) {
  const admin = createServiceRoleClient();
  await admin.auth.admin.updateUserById(userId, { email_confirm: true });
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    throw new Error(error?.message ?? "Could not sign in after signup.");
  }
  return data.user;
}

export async function signUpAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email.includes("@") || password.length < 8) {
    return {
      ok: false,
      error: "Use a valid email and a password of at least 8 characters.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || undefined },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data.user) {
    return { ok: false, error: "Could not create account." };
  }

  try {
    let user = data.user;
    if (!data.session) {
      user = await confirmAndSignIn(email, password, data.user.id);
    }
    await ensureMemberAccount(await createClient(), user);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Account setup failed.",
    };
  }

  redirect("/digest");
}

export async function signInAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data.user) {
    return { ok: false, error: "Sign in failed." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  try {
    if (profile?.role !== "admin") {
      await ensureMemberAccount(supabase, data.user);
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Account setup failed.",
    };
  }

  const next = String(formData.get("next") ?? "/digest");
  redirect(next.startsWith("/") ? next : "/digest");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getSessionDigest(): Promise<{
  authenticated: boolean;
  email: string | null;
  digest: Digest | null;
  deliveredCount: number;
  source: "supabase" | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authenticated: false,
      email: null,
      digest: null,
      deliveredCount: 0,
      source: null,
    };
  }

  try {
    await ensureMemberAccount(supabase, user);
  } catch {
    // Digest load can still proceed if business exists from a prior bootstrap.
  }

  const loaded = await loadDigestForUser(supabase);
  return {
    authenticated: true,
    email: user.email ?? null,
    digest: loaded.digest,
    deliveredCount: loaded.deliveredCount,
    source: loaded.digest ? "supabase" : null,
  };
}
