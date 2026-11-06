"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import {
  ensureMemberAccount,
  provisionSubscription,
} from "@/lib/shortlist/bootstrap-account";
import {
  deliverFirstDrop,
  resolveCustomerByUserId,
} from "@/lib/shortlist/deliver-first-drop";
import { assertCanRunPaidDiscovery, deeplineBatchSize } from "@/lib/shortlist/entitlements";
import { loadDigestForUser } from "@/lib/shortlist/load-digest";
import type { Digest } from "@/lib/shortlist/schemas";
import { normalizeDomain } from "@/lib/shortlist/url";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type AuthResult =
  | { ok: true; pending?: "code" }
  | { ok: false; error: string };

function readEmail(formData: FormData): string {
  return String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
}

export async function sendLoginCodeAction(
  formData: FormData,
): Promise<AuthResult> {
  const email = readEmail(formData);
  if (!email.includes("@")) {
    return { ok: false, error: "Enter a valid email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, pending: "code" };
}

export async function verifyLoginCodeAction(
  formData: FormData,
): Promise<AuthResult> {
  const email = readEmail(formData);
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");

  if (!email.includes("@") || !/^\d{6}$/.test(token)) {
    return { ok: false, error: "Enter the 6-digit code from your email." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
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
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
      ? next
      : "/digest";
  redirect(safeNext);
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

    // Ensure a live plan before paid Ocean/Deepline work. Prefer Pro (5/drop).
    await provisionSubscription(user.id, customer.businessId, "pro");

    const entitlement = await assertCanRunPaidDiscovery(admin, customer.businessId);
    if (!entitlement.ok) {
      return { ok: false, error: entitlement.error };
    }

    await deliverFirstDrop(admin, {
      businessId: customer.businessId,
      audienceId: customer.audienceId,
      seeds,
      profile: {
        website: parsed.data.website ?? "",
        services: [],
        industries: [],
        buyerTitles: [],
        seedClients: seeds,
        companySizes: parsed.data.companySizes ?? [],
        regions: parsed.data.regions ?? ["North America"],
        excludedDomains: (parsed.data.excludedDomains ?? [])
          .map((domain) => normalizeDomain(domain))
          .filter((domain): domain is string => !!domain),
      },
      planId: entitlement.planId,
      targetCount: deeplineBatchSize(
        parsed.data.targetCount ?? entitlement.accountsPerDrop,
      ),
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
