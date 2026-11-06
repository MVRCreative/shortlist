import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createServiceRoleClient } from "@/lib/supabase/server";

type Client = SupabaseClient<Database>;

export type MemberAccountState = {
  businessId: string | null;
  icpId: string | null;
  onboardingCompleted: boolean;
};

/**
 * Ensures the auth profile exists. Does not invent a business, ICP, or subscription.
 * Real profile and audience rows are written when the user confirms those steps.
 */
export async function ensureMemberAccount(
  client: Client,
  user: { id: string; email?: string | null },
): Promise<MemberAccountState> {
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    throw new Error(`profiles select failed: ${profileError.message}`);
  }
  if (!profile) {
    const { error } = await client.from("profiles").insert({
      id: user.id,
      email: user.email ?? `${user.id}@users.local`,
      full_name: null,
    });
    if (error) {
      throw new Error(`profiles insert failed: ${error.message}`);
    }
  }

  const { data: business, error: businessError } = await client
    .from("businesses")
    .select("id, onboarding_completed_at")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (businessError) {
    throw new Error(`businesses select failed: ${businessError.message}`);
  }
  if (!business) {
    return { businessId: null, icpId: null, onboardingCompleted: false };
  }

  const { data: icp, error: icpError } = await client
    .from("icps")
    .select("id")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .eq("is_primary", true)
    .maybeSingle();
  if (icpError) throw new Error(`icps select failed: ${icpError.message}`);

  let icpId = icp?.id ?? null;
  if (!icpId) {
    const { data: anyActive, error: anyError } = await client
      .from("icps")
      .select("id")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .maybeSingle();
    if (anyError) throw new Error(`icps select failed: ${anyError.message}`);
    icpId = anyActive?.id ?? null;
  }

  return {
    businessId: business.id,
    icpId,
    onboardingCompleted: !!business.onboarding_completed_at,
  };
}

/** Write the subscription the member selected. Idempotent for live statuses. */
export async function provisionSubscription(
  userId: string,
  businessId: string,
  planId: string,
): Promise<void> {
  const admin = createServiceRoleClient();
  const { data: owned } = await admin
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (!owned) {
    throw new Error("not authorized to provision subscription");
  }

  const { data: existing, error: subError } = await admin
    .from("subscriptions")
    .select("id, plan_id")
    .eq("business_id", businessId)
    .in("status", ["trialing", "active", "past_due"])
    .maybeSingle();
  if (subError) throw new Error(`subscriptions select failed: ${subError.message}`);

  const periodStart = new Date();
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (existing) {
    if (existing.plan_id === planId) return;
    const { error } = await admin
      .from("subscriptions")
      .update({
        plan_id: planId,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw new Error(`subscriptions update failed: ${error.message}`);
    return;
  }

  const { error } = await admin.from("subscriptions").insert({
    business_id: businessId,
    plan_id: planId,
    status: "active",
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
  });
  if (error) {
    throw new Error(`subscriptions insert failed: ${error.message}`);
  }
}
