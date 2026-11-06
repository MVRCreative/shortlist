import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCampaignContent } from "@/lib/shortlist/campaign-content";
import type { Digest } from "@/lib/shortlist/schemas";
import type { Database, Json } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

type Snapshot = {
  company?: {
    name?: string;
    domain?: string;
    industry?: string | null;
    employeeRange?: string | null;
    region?: string | null;
  };
  contact?: {
    fullName?: string;
    title?: string | null;
    linkedinUrl?: string | null;
    email?: string | null;
  } | null;
  signal?: { title?: string; type?: string } | null;
};

function asSnapshot(raw: Json): Snapshot {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Snapshot;
}

const REGION_LABELS: Record<Database["public"]["Enums"]["region_code"], string> = {
  north_america: "North America",
  uk_ireland: "UK & Ireland",
  europe: "Europe",
  apac: "APAC",
  latin_america: "Latin America",
};

async function audienceFor(client: Client, businessId: string) {
  const empty = { industries: [] as string[], buyerTitles: [] as string[], regions: [] as string[] };
  const { data: icp, error } = await client
    .from("icps")
    .select("custom_industries, industry_slugs, buyer_titles, regions")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !icp) return empty;

  const labels = new Map<string, string>();
  if (icp.industry_slugs.length > 0) {
    const { data: industries } = await client
      .from("industries")
      .select("slug, label")
      .in("slug", icp.industry_slugs);
    for (const industry of industries ?? []) labels.set(industry.slug, industry.label);
  }

  return {
    industries: [
      ...icp.industry_slugs.map((slug) => labels.get(slug) ?? slug.replaceAll("_", " ")),
      ...icp.custom_industries,
    ],
    buyerTitles: icp.buyer_titles,
    regions: icp.regions.map((region) => REGION_LABELS[region]),
  };
}

function placeholderLinkedIn(name: string, company: string): string {
  const q = encodeURIComponent(`${name} ${company}`);
  return `https://www.linkedin.com/search/results/all/?keywords=${q}`;
}

/**
 * Loads the latest delivered drop for the authenticated member and maps it
 * into the existing Digest UI shape. Tenant-scoped via RLS (my_business_id).
 */
export async function loadDigestForUser(client: Client): Promise<{
  digest: Digest | null;
  dropId: string | null;
  deliveredCount: number;
}> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return { digest: null, dropId: null, deliveredCount: 0 };
  }

  const { data: business, error: businessError } = await client
    .from("businesses")
    .select("id, name, services, website_domain, description, case_study_urls")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (businessError) {
    throw new Error(businessError.message);
  }
  if (!business) {
    return { digest: null, dropId: null, deliveredCount: 0 };
  }

  const { data: drop, error: dropError } = await client
    .from("drops")
    .select("id, delivered_count, shortfall, shortfall_note, delivered_at")
    .eq("business_id", business.id)
    .eq("status", "delivered")
    .order("delivered_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (dropError) throw new Error(dropError.message);
  if (!drop) {
    return { digest: null, dropId: null, deliveredCount: 0 };
  }

  const { data: accounts, error: accountsError } = await client
    .from("drop_accounts")
    .select(
      "id, position, fit_reason, outreach_angle, linkedin_message, snapshot",
    )
    .eq("drop_id", drop.id)
    .order("position", { ascending: true });
  if (accountsError) throw new Error(accountsError.message);

  const leads = (accounts ?? []).map((row) => {
    const snap = asSnapshot(row.snapshot);
    const companyName = snap.company?.name ?? "Unknown company";
    const domain = snap.company?.domain ?? "";
    const contactName = snap.contact?.fullName ?? "Decision-maker TBD";
    const title = snap.contact?.title ?? "Leadership";
    const linkedinUrl =
      snap.contact?.linkedinUrl && snap.contact.linkedinUrl.startsWith("http")
        ? snap.contact.linkedinUrl
        : placeholderLinkedIn(contactName, companyName);
    const email =
      typeof snap.contact?.email === "string" && snap.contact.email.includes("@")
        ? snap.contact.email
        : null;

    return {
      contactName,
      title,
      company: companyName,
      domain,
      email,
      linkedinUrl,
      signal: snap.signal?.title ?? "ICP lookalike match",
      angle: row.outreach_angle,
      fitReason: row.fit_reason,
      message: row.linkedin_message,
    };
  });

  const studio = business.name ?? "your studio";
  const audience = await audienceFor(client, business.id);
  const theme =
    drop.shortfall && drop.shortfall > 0
      ? `Strong matches this week (${leads.length})`
      : "Your Shortlist this week";
  const content = buildCampaignContent({
    profile: {
      companyName: studio,
      website: business.website_domain,
      description: business.description ?? "",
      services: business.services ?? [],
      industries: audience.industries,
      buyerTitles: audience.buyerTitles,
      regions: audience.regions,
      caseStudies: business.case_study_urls ?? [],
    },
  });

  const digest: Digest = {
    theme,
    leads,
    linkedinPost: {
      hook: content.linkedinPost.hook,
      body: content.linkedinPost.body,
    },
    xPost: content.xPost.body,
    blogIdea: {
      title: content.blogIdea.title,
      angle: content.blogIdea.angle,
      outline: content.blogIdea.outline,
    },
  };

  return {
    digest,
    dropId: drop.id,
    deliveredCount: leads.length,
  };
}
