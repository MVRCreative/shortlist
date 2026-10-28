"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { ensureMemberAccount } from "@/lib/shortlist/bootstrap-account";
import {
  deliverFirstDrop,
  resolveCustomerByUserId,
} from "@/lib/shortlist/deliver-first-drop";
import { loadDigestForUser } from "@/lib/shortlist/load-digest";
import type { Digest } from "@/lib/shortlist/schemas";
import { normalizeDomain } from "@/lib/shortlist/url";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type AuthResult =
  | { ok: true; pending?: "confirm_email" | "reset_email" }
  | { ok: false; error: string };

async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) {
    throw new Error("Could not determine the app URL.");
  }
  const forwarded = headerList.get("x-forwarded-proto");
  const proto =
    forwarded ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${proto}://${host}`;
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

  let origin: string;
  try {
    origin = await requestOrigin();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not create account.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || undefined },
      emailRedirectTo: `${origin}/auth/confirm?next=/digest`,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data.user) {
    return { ok: false, error: "Could not create account." };
  }

  // Hosted Supabase sends the confirm-signup email when confirmations are on.
  // The account is created after the user opens that link.
  if (!data.session) {
    return { ok: true, pending: "confirm_email" };
  }

  try {
    await ensureMemberAccount(await createClient(), data.user);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Account setup failed.",
    };
  }

  redirect("/digest");
}

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email.includes("@")) {
    return { ok: false, error: "Enter the email on your account." };
  }

  let origin: string;
  try {
    origin = await requestOrigin();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not send reset email.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/auth/update-password`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, pending: "reset_email" };
}

export async function updatePasswordAction(
  formData: FormData,
): Promise<AuthResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { ok: false, error: "Use a password of at least 8 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: "This reset link has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, error: error.message };
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

const firstDropRequestSchema = z.object({
  seeds: z.array(z.string().trim().min(3).max(253)).min(2).max(3),
  website: z.string().trim().max(253).optional(),
  companySizes: z.array(z.string().max(40)).max(6).optional(),
  regions: z.array(z.string().max(40)).max(6).optional(),
  excludedDomains: z.array(z.string().trim().max(253)).max(200).optional(),
  targetCount: z.number().int().min(1).max(25).optional(),
});

export type FirstDropResult =
  | { ok: true; digest: Digest; deliveredCount: number; created: boolean }
  | { ok: false; error: string };

/**
 * Load an existing delivered drop, or build the member's first real drop via Ocean.
 * Never returns AI/demo accounts.
 */
export async function requestFirstDrop(
  raw: z.infer<typeof firstDropRequestSchema>,
): Promise<FirstDropResult> {
  const parsed = firstDropRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Add 2–3 example client websites so we can find lookalikes.",
    };
  }

  const seeds = parsed.data.seeds
    .map((seed) => normalizeDomain(seed))
    .filter((domain): domain is string => !!domain);
  if (seeds.length < 2) {
    return {
      ok: false,
      error: "Add 2–3 example client websites so we can find lookalikes.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sign in to get your Shortlist." };
  }

  try {
    await ensureMemberAccount(supabase, user);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Account setup failed.",
    };
  }

  const existing = await loadDigestForUser(supabase);
  if (existing.digest) {
    return {
      ok: true,
      digest: existing.digest,
      deliveredCount: existing.deliveredCount,
      created: false,
    };
  }

  let env;
  try {
    env = getServerEnv();
  } catch {
    return {
      ok: false,
      error: "Delivery isn’t configured yet. Contact support.",
    };
  }

  try {
    const admin = createServiceRoleClient();
    const customer = await resolveCustomerByUserId(admin, user.id);
    await deliverFirstDrop(admin, {
      businessId: customer.businessId,
      icpId: customer.icpId,
      seeds,
      profile: {
        website: parsed.data.website ?? "",
        seedClients: seeds,
        companySizes: parsed.data.companySizes ?? [],
        regions: parsed.data.regions ?? ["North America"],
        excludedDomains: (parsed.data.excludedDomains ?? [])
          .map((domain) => normalizeDomain(domain))
          .filter((domain): domain is string => !!domain),
      },
      targetCount: parsed.data.targetCount ?? 10,
      oceanToken: env.OCEAN_API_TOKEN,
    });
  } catch (err) {
    console.error("[shortlist] requestFirstDrop failed", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Couldn’t build your Shortlist. Try again.",
    };
  }

  const loaded = await loadDigestForUser(supabase);
  if (!loaded.digest) {
    return {
      ok: false,
      error: "Drop was created but couldn’t be loaded. Refresh and try again.",
    };
  }

  return {
    ok: true,
    digest: loaded.digest,
    deliveredCount: loaded.deliveredCount,
    created: true,
  };
}
