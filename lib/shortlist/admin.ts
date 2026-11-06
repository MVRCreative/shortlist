import { z } from "zod";

import type { Database, Json } from "@/lib/supabase/database.types";
import type { AdminAccount, AdminUserDetail, AdminUserSummary } from "@/lib/shortlist/admin-display";
import { createClient } from "@/lib/supabase/server";

export type {
  AdminAccount,
  AdminAccountDetails,
  AdminDigest,
  AdminUserDetail,
  AdminUserSummary,
} from "@/lib/shortlist/admin-display";
export { digestStatusLabel, roleLabel } from "@/lib/shortlist/admin-display";

export type AdminSession =
  | { status: "signed_out" }
  | { status: "forbidden"; email: string }
  | { status: "admin"; email: string };

const snapshotSchema = z.object({
  company: z
    .object({
      name: z.string().nullish(),
      domain: z.string().nullish(),
    })
    .nullish(),
  contact: z
    .object({
      fullName: z.string().nullish(),
      title: z.string().nullish(),
    })
    .nullish(),
});

export async function getAdminSession(): Promise<AdminSession> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return { status: "signed_out" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) return { status: "signed_out" };
  if (profile.role !== "admin") {
    return { status: "forbidden", email: profile.email };
  }
  return { status: "admin", email: profile.email };
}

const dealSizeLabels: Record<Database["public"]["Enums"]["deal_size"], string> = {
  under_10k: "Under $10K",
  "10k_25k": "$10–25K",
  "25k_75k": "$25–75K",
  "75k_plus": "$75K+",
};

const sizeLabels: Record<Database["public"]["Enums"]["employee_range"], string> = {
  "1-10": "1–10",
  "11-50": "11–50",
  "51-200": "51–200",
  "201-500": "201–500",
  "501-1000": "501–1,000",
  "1000+": "1,000+",
};

const regionLabels: Record<Database["public"]["Enums"]["region_code"], string> = {
  north_america: "North America",
  uk_ireland: "UK & Ireland",
  europe: "Europe",
  apac: "APAC",
  latin_america: "Latin America",
};

const signalLabels: Record<Database["public"]["Enums"]["signal_type"], string> = {
  funding: "Funding",
  hiring: "Hiring",
  leadership_change: "Leadership change",
  product_launch: "Product launch",
  expansion: "Expansion",
  news: "News",
  other: "Other",
};

const subscriptionStatusLabels: Record<
  Database["public"]["Enums"]["subscription_status"],
  string
> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Incomplete",
  incomplete_expired: "Incomplete",
  unpaid: "Unpaid",
  paused: "Paused",
};

export async function loadAdminUsers(): Promise<
  { ok: true; users: AdminUserSummary[] } | { ok: false }
> {
  const supabase = await createClient();
  const [profilesResult, businessesResult, dropsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("businesses").select("id, owner_id, name, website_domain"),
    supabase.from("drops").select("business_id"),
  ]);

  if (profilesResult.error || businessesResult.error || dropsResult.error) {
    return { ok: false };
  }

  const digestCountByBusiness = new Map<string, number>();
  for (const drop of dropsResult.data) {
    digestCountByBusiness.set(
      drop.business_id,
      (digestCountByBusiness.get(drop.business_id) ?? 0) + 1,
    );
  }

  const businessByOwner = new Map<
    string,
    { name: string | null; websiteDomain: string; digestCount: number }
  >();
  for (const business of businessesResult.data) {
    businessByOwner.set(business.owner_id, {
      name: business.name,
      websiteDomain: business.website_domain,
      digestCount: digestCountByBusiness.get(business.id) ?? 0,
    });
  }

  const users = profilesResult.data.map((profile) => {
    const business = businessByOwner.get(profile.id);
    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      businessName: business?.name ?? null,
      websiteDomain: business?.websiteDomain ?? null,
      digestCount: business?.digestCount ?? 0,
    };
  });

  return { ok: true, users };
}

export async function loadAdminUser(
  userId: string,
): Promise<{ ok: true; user: AdminUserDetail | null } | { ok: false }> {
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return { ok: false };
  if (!profile) return { ok: true, user: null };

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(
      "id, name, website_domain, description, services, deal_size, onboarding_completed_at",
    )
    .eq("owner_id", userId)
    .maybeSingle();

  if (businessError) return { ok: false };
  if (!business) {
    return {
      ok: true,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role,
        createdAt: profile.created_at,
        businessName: null,
        websiteDomain: null,
        digestCount: 0,
        account: null,
        digests: [],
      },
    };
  }

  const [audienceResult, subscriptionResult, dropsResult, accountsResult, industriesResult] =
    await Promise.all([
      supabase
        .from("audiences")
        .select(
          "industry_slugs, custom_industries, employee_ranges, regions, buyer_titles, signal_types",
        )
        .eq("business_id", business.id)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan_id, status")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("drops")
        .select(
          "id, status, scheduled_for, delivered_count, target_count, shortfall_note",
        )
        .eq("business_id", business.id)
        .order("scheduled_for", { ascending: false }),
      supabase
        .from("drop_accounts")
        .select("id, drop_id, position, fit_reason, snapshot")
        .eq("business_id", business.id)
        .order("position", { ascending: true }),
      supabase.from("industries").select("slug, label"),
    ]);

  if (
    audienceResult.error ||
    subscriptionResult.error ||
    dropsResult.error ||
    accountsResult.error ||
    industriesResult.error
  ) {
    return { ok: false };
  }

  let planName: string | null = null;
  const subscription = subscriptionResult.data;
  if (subscription) {
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("name")
      .eq("id", subscription.plan_id)
      .maybeSingle();
    if (planError) return { ok: false };
    planName = plan?.name ?? null;
  }

  const industryLabels = new Map(
    industriesResult.data.map((industry) => [industry.slug, industry.label]),
  );
  const audience = audienceResult.data;
  const accountsByDrop = new Map<string, AdminAccount[]>();
  for (const row of accountsResult.data) {
    const list = accountsByDrop.get(row.drop_id) ?? [];
    list.push(toAccount(row));
    accountsByDrop.set(row.drop_id, list);
  }

  const digests = dropsResult.data.map((drop) => ({
    id: drop.id,
    status: drop.status,
    scheduledFor: drop.scheduled_for,
    deliveredCount: drop.delivered_count,
    targetCount: drop.target_count,
    shortfallNote: drop.shortfall_note,
    accounts: accountsByDrop.get(drop.id) ?? [],
  }));

  return {
    ok: true,
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      createdAt: profile.created_at,
      businessName: business.name,
      websiteDomain: business.website_domain,
      digestCount: digests.length,
      account: {
        description: business.description,
        services: business.services,
        dealSize: business.deal_size ? dealSizeLabels[business.deal_size] : null,
        onboardingCompletedAt: business.onboarding_completed_at,
        planName,
        subscriptionStatus: subscription
          ? subscriptionStatusLabels[subscription.status]
          : null,
        industries: [
          ...(audience?.industry_slugs.map(
            (slug) => industryLabels.get(slug) ?? slug,
          ) ?? []),
          ...(audience?.custom_industries ?? []),
        ],
        companySizes: audience?.employee_ranges.map((size) => sizeLabels[size]) ?? [],
        regions: audience?.regions.map((region) => regionLabels[region]) ?? [],
        buyerTitles: audience?.buyer_titles ?? [],
        signals: audience?.signal_types.map((signal) => signalLabels[signal]) ?? [],
      },
      digests,
    },
  };
}

function toAccount(row: {
  id: string;
  position: number;
  fit_reason: string;
  snapshot: Json;
}): AdminAccount {
  const snapshot = snapshotSchema.safeParse(row.snapshot);
  const company = snapshot.success ? snapshot.data.company : null;
  const contact = snapshot.success ? snapshot.data.contact : null;
  const contactName = contact?.fullName?.trim() || null;
  const contactTitle = contact?.title?.trim() || null;

  return {
    id: row.id,
    position: row.position,
    company: company?.name?.trim() || "Account",
    domain: company?.domain?.trim() || null,
    contact: contactName
      ? contactTitle
        ? `${contactName} · ${contactTitle}`
        : contactName
      : null,
    fitReason: row.fit_reason,
  };
}
