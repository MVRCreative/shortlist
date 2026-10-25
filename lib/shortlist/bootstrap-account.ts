import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createServiceRoleClient } from "@/lib/supabase/server";

type Client = SupabaseClient<Database>;

/**
 * Ensures the authenticated user has a business, active ICP, and starter subscription.
 * Idempotent — safe to call on every login.
 * Subscriptions are written with the service role (members only have SELECT).
 */
export async function ensureMemberAccount(
  client: Client,
  user: { id: string; email?: string | null },
): Promise<{ businessId: string; icpId: string }> {
  const { data: existingBusiness, error: businessError } = await client
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (businessError) {
    throw new Error(`businesses select failed: ${businessError.message}`);
  }

  let businessId = existingBusiness?.id;
  if (!businessId) {
    const domainFromEmail =
      user.email?.split("@")[1]?.toLowerCase() || "example.com";
    const { data, error } = await client
      .from("businesses")
      .insert({
        owner_id: user.id,
        website_domain: domainFromEmail,
        name: "My studio",
        services: ["brand strategy", "website design"],
        onboarding_completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(`businesses insert failed: ${error?.message}`);
    }
    businessId = data.id;
  }

  const { data: existingIcp, error: icpError } = await client
    .from("icps")
    .select("id")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .maybeSingle();
  if (icpError) throw new Error(`icps select failed: ${icpError.message}`);

  let icpId = existingIcp?.id;
  if (!icpId) {
    const { data, error } = await client
      .from("icps")
      .insert({
        business_id: businessId,
        version: 1,
        is_active: true,
        industry_slugs: ["b2b_saas"],
        employee_ranges: ["11-50", "51-200", "201-500"],
        regions: ["north_america"],
        buyer_titles: ["Head of Marketing", "VP Marketing", "CMO", "CEO"],
        signal_types: ["funding"],
      })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(`icps insert failed: ${error?.message}`);
    }
    icpId = data.id;
  }

  const { data: existingSub, error: subError } = await client
    .from("subscriptions")
    .select("id")
    .eq("business_id", businessId)
    .in("status", ["trialing", "active", "past_due"])
    .maybeSingle();
  if (subError) throw new Error(`subscriptions select failed: ${subError.message}`);

  if (!existingSub) {
    // Members may only SELECT subscriptions; provision via service role after ownership check.
    const admin = createServiceRoleClient();
    const { data: owned } = await admin
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!owned) {
      throw new Error("not authorized to provision subscription");
    }
    const { error } = await admin.from("subscriptions").insert({
      business_id: businessId,
      plan_id: "starter",
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
    if (error) {
      throw new Error(`subscriptions insert failed: ${error.message}`);
    }
  }

  return { businessId, icpId };
}
