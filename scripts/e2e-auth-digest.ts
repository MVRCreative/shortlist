/**
 * End-to-end: create a real Auth user → bootstrap business → Ocean 10-account
 * drop → verify member can read own drop_accounts via anon key + user JWT,
 * and cannot read another tenant's rows.
 */
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import { getServerEnv, resetServerEnvCacheForTests } from "@/lib/env";
import { loadDigestForUser } from "@/lib/shortlist/load-digest";
import type { Database } from "@/lib/supabase/database.types";

loadEnv({ path: ".env.local", override: true });

const PASSWORD = "ShortlistTest1!";
const SEEDS = "stripe.com,notion.so";

async function main() {
  resetServerEnvCacheForTests();
  const env = getServerEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY missing");

  const admin = createClient<Database>(url, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = `shortlist.e2e.${Date.now()}@example.com`;
  console.log("1) Create auth user", email);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "E2E Test Customer" },
  });
  if (createError || !created.user) {
    throw new Error(createError?.message ?? "createUser failed");
  }

  // Bootstrap as the member would (via service role client mimicking ensureMemberAccount ownership checks)
  const member = createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await member.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (signInError) throw new Error(signInError.message);

  // ensureMemberAccount uses createServiceRoleClient from next/headers in app —
  // here we bootstrap with the member client for business/icp and admin for sub.
  const {
    data: { user },
  } = await member.auth.getUser();
  if (!user) throw new Error("no user after sign-in");

  const { data: business, error: bErr } = await member
    .from("businesses")
    .insert({
      owner_id: user.id,
      website_domain: "example.com",
      name: "E2E Studio",
      services: ["brand strategy", "product design"],
      onboarding_completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (bErr || !business) throw new Error(bErr?.message ?? "business insert");

  const { data: audience, error: iErr } = await member
    .from("audiences")
    .insert({
      business_id: business.id,
      lineage_id: crypto.randomUUID(),
      version: 1,
      is_active: true,
      is_primary: true,
      name: "Primary audience",
      industry_slugs: ["b2b_saas"],
      employee_ranges: ["11-50", "51-200", "201-500"],
      regions: ["north_america"],
      buyer_titles: ["Head of Marketing", "VP Marketing", "CMO", "CEO"],
      signal_types: ["funding"],
    })
    .select("id")
    .single();
  if (iErr || !audience) throw new Error(iErr?.message ?? "audience insert");

  await admin.from("subscriptions").insert({
    business_id: business.id,
    plan_id: "starter",
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
  });

  console.log("2) Ocean deliver (10 accounts)…");
  const deliver = spawnSync(
    "pnpm",
    ["ocean:deliver", "--", "--email", email, "--seeds", SEEDS],
    { cwd: process.cwd(), encoding: "utf8", env: process.env },
  );
  console.log(deliver.stdout);
  if (deliver.status !== 0) {
    console.error(deliver.stderr);
    throw new Error(`ocean:deliver failed with ${deliver.status}`);
  }

  console.log("3) Member digest load (RLS)…");
  // Re-auth to refresh JWT
  await member.auth.signInWithPassword({ email, password: PASSWORD });
  const loaded = await loadDigestForUser(member);
  if (!loaded.digest || loaded.digest.leads.length === 0) {
    throw new Error("Member could not load digest via RLS");
  }
  console.log(`   leads=${loaded.digest.leads.length} theme=${loaded.digest.theme}`);

  const emailsPresent = loaded.digest.leads.filter((l) => l.email).length;
  console.log(`   leads_with_email=${emailsPresent} (expected 0 without email credits)`);

  console.log("4) Tenant isolation…");
  const { data: otherBiz } = await admin
    .from("businesses")
    .select("id")
    .neq("id", business.id)
    .limit(1)
    .maybeSingle();

  if (otherBiz) {
    const { data: leaked, error: leakErr } = await member
      .from("drop_accounts")
      .select("id, business_id")
      .eq("business_id", otherBiz.id);
    if (leakErr) throw new Error(leakErr.message);
    if ((leaked ?? []).length > 0) {
      throw new Error("RLS FAILED: member read another business drop_accounts");
    }
    console.log("   OK — cannot read other business drop_accounts");
  } else {
    console.log("   (no other business to probe — skipped cross-tenant check)");
  }

  const { count: ownCount } = await member
    .from("drop_accounts")
    .select("id", { count: "exact", head: true });
  console.log(`   own drop_accounts visible=${ownCount}`);

  console.log("\n=== E2E PASS ===");
  console.log(
    JSON.stringify(
      {
        email,
        password: PASSWORD,
        businessId: business.id,
        leads: loaded.digest.leads.length,
        companies: loaded.digest.leads.map((l) => l.domain),
        demoMode: false,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.stack ?? e.message : e);
  process.exit(1);
});
