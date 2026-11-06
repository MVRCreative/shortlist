/**
 * Deliver a Shortlist drop for a business.
 * Ocean finds lookalike companies. Deepline enriches contacts once (max plan size / 10).
 * Never fabricates emails or buying signals.
 */
import { enrichAccountsWithDeepline } from "@/lib/deepline/enrich-accounts";
import { OceanClient } from "@/lib/ocean/client";
import {
  COMPANY_SEARCH_FIELDS,
  exactIndustryOceanValues,
} from "@/lib/ocean/map-company";
import {
  ensureTestLibrary,
  loadOceanValuesBySlug,
  logProviderCall,
  persistCompanySearch,
  syncIndustryOceanValues,
  type ServiceClient,
} from "@/lib/ocean/persist";
import { creditTotal, unwrapOceanCompany } from "@/lib/ocean/schemas";
import { buildCampaignAwareCopy, type CampaignCopyContext } from "@/lib/shortlist/campaign-copy";
import { buildCampaignContent } from "@/lib/shortlist/campaign-content";
import { deeplineBatchSize } from "@/lib/shortlist/entitlements";
import { isDeliverableAccount, signalFromAccount } from "@/lib/shortlist/live-digest";
import { buildCompanySearch, toSampleAccounts } from "@/lib/shortlist/ocean-match";
import type { EnrichedProfile, ProfileInput } from "@/lib/shortlist/schemas";
import { normalizeDomain } from "@/lib/shortlist/url";
import type { Json } from "@/lib/supabase/database.types";

const DEFAULT_TARGET = 10;

export type DeliverFirstDropInput = {
  businessId: string;
  icpId: string;
  /** 2–3 lookalike client domains from onboarding. */
  seeds: string[];
  /** Optional ICP filters; when set, drives Ocean company search. */
  profile?: Pick<
    ProfileInput,
    | "website"
    | "seedClients"
    | "companySizes"
    | "regions"
    | "excludedDomains"
    | "buyerTitles"
    | "industries"
    | "services"
  >;
  buyerTitles?: string[];
  campaign?: CampaignCopyContext;
  campaignId?: string | null;
  audienceSnapshot?: Json | null;
  campaignSnapshot?: Json | null;
  enriched?: EnrichedProfile | null;
  planId?: string;
  targetCount?: number;
  oceanToken: string;
  /** Domains already delivered or reviewed as not-a-fit. */
  extraExcludeDomains?: string[];
};

export type DeliverFirstDropResult = {
  dropId: string;
  deliveredCount: number;
  shortfall: number;
  shortfallNote: string | null;
};

function normalizeSeeds(seeds: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const seed of seeds) {
    const domain = normalizeDomain(seed);
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);
    out.push(domain);
  }
  return out;
}

async function syncSeeds(
  client: ServiceClient,
  icpId: string,
  seeds: string[],
): Promise<void> {
  const { data: existingSeeds } = await client
    .from("icp_seed_accounts")
    .select("domain")
    .eq("icp_id", icpId);
  const have = new Set((existingSeeds ?? []).map((row) => row.domain));
  for (const seed of seeds) {
    if (have.has(seed) || have.size >= 3) continue;
    const { error } = await client.from("icp_seed_accounts").insert({
      icp_id: icpId,
      domain: seed,
    });
    if (error) throw new Error(`icp_seed_accounts insert failed: ${error.message}`);
    have.add(seed);
  }
}

/**
 * Look up business + active ICP for an auth user id (service role).
 */
export async function resolveCustomerByUserId(
  client: ServiceClient,
  userId: string,
): Promise<{ businessId: string; icpId: string }> {
  const { data: business, error: bErr } = await client
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (bErr) throw new Error(bErr.message);
  if (!business) {
    throw new Error("No business for this account. Complete signup first.");
  }

  const { data: icp, error: iErr } = await client
    .from("icps")
    .select("id")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .eq("is_primary", true)
    .maybeSingle();
  if (iErr) throw new Error(iErr.message);

  if (icp) return { businessId: business.id, icpId: icp.id };

  const { data: anyIcp, error: anyErr } = await client
    .from("icps")
    .select("id")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .maybeSingle();
  if (anyErr) throw new Error(anyErr.message);
  if (!anyIcp) throw new Error("No active audience for this account.");

  return { businessId: business.id, icpId: anyIcp.id };
}

export async function resolveCustomerByEmail(
  client: ServiceClient,
  email: string,
): Promise<{ userId: string; businessId: string; icpId: string }> {
  const normalized = email.trim().toLowerCase();
  const { data: listed, error } = await client.auth.admin.listUsers({
    perPage: 1000,
  });
  if (error) throw new Error(error.message);
  const user = listed.users.find((u) => u.email?.toLowerCase() === normalized);
  if (!user) {
    throw new Error(
      `No auth user for ${normalized}. Sign up in the app first, then re-run.`,
    );
  }
  const resolved = await resolveCustomerByUserId(client, user.id);
  return { userId: user.id, ...resolved };
}

async function upsertDeeplineContact(
  client: ServiceClient,
  companyId: string,
  enrichment: {
    contactName: string;
    firstName: string | null;
    lastName: string | null;
    title: string | null;
    linkedinUrl: string | null;
    email: string | null;
  },
): Promise<string> {
  const sourceId = enrichment.linkedinUrl ?? `${companyId}:${enrichment.contactName}`;

  const { data: byLinkedIn } = enrichment.linkedinUrl
    ? await client
        .from("contacts")
        .select("id")
        .eq("linkedin_url", enrichment.linkedinUrl)
        .maybeSingle()
    : { data: null };

  if (byLinkedIn) {
    const { data, error } = await client
      .from("contacts")
      .update({
        company_id: companyId,
        full_name: enrichment.contactName,
        first_name: enrichment.firstName,
        last_name: enrichment.lastName,
        title: enrichment.title,
        linkedin_url: enrichment.linkedinUrl,
        email: enrichment.email,
        email_status: enrichment.email ? "verified" : "unknown",
        email_verified_at: enrichment.email ? new Date().toISOString() : null,
        source: "manual",
        source_id: sourceId,
      })
      .eq("id", byLinkedIn.id)
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "contact update failed");
    return data.id;
  }

  const { data, error } = await client
    .from("contacts")
    .insert({
      company_id: companyId,
      full_name: enrichment.contactName,
      first_name: enrichment.firstName,
      last_name: enrichment.lastName,
      title: enrichment.title,
      linkedin_url: enrichment.linkedinUrl,
      email: enrichment.email,
      email_status: enrichment.email ? "verified" : "unknown",
      email_verified_at: enrichment.email ? new Date().toISOString() : null,
      source: "manual",
      source_id: sourceId,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "contact insert failed");
  return data.id;
}

export async function deliverFirstDrop(
  client: ServiceClient,
  input: DeliverFirstDropInput,
): Promise<DeliverFirstDropResult> {
  const target = deeplineBatchSize(input.targetCount ?? DEFAULT_TARGET);
  const seeds = normalizeSeeds(input.seeds);
  if (seeds.length < 2) {
    throw new Error(
      "Add at least 2 example client websites so we can find lookalikes.",
    );
  }
  if (seeds.length > 3) {
    throw new Error("Use at most 3 example client websites.");
  }

  const ocean = new OceanClient(input.oceanToken);
  const log =
    (businessId?: string) =>
    async (meta: Parameters<typeof logProviderCall>[1]) => {
      await logProviderCall(client, { ...meta, businessId });
    };

  const balance = await ocean.getCreditBalance(log());
  const companyCredits = creditTotal(balance.credits);
  if (companyCredits < 8) {
    throw new Error(
      `Not enough Ocean credits to build your Shortlist (need ≥8, have ${companyCredits}).`,
    );
  }

  await syncSeeds(client, input.icpId, seeds);

  const dataFields = await ocean.getDataFields(log(input.businessId));
  const { data: industries } = await client
    .from("industries")
    .select("slug, label");
  await syncIndustryOceanValues(
    client,
    exactIndustryOceanValues(industries ?? [], dataFields.industries),
  );

  const profileForSearch: ProfileInput = {
    website: input.profile?.website ?? "",
    services: input.profile?.services ?? [],
    caseStudies: [],
    seedClients: seeds,
    referenceClients: [],
    industries: input.profile?.industries ?? [],
    companySizes: input.profile?.companySizes ?? [],
    regions: input.profile?.regions ?? ["North America"],
    buyerTitles: input.buyerTitles ?? input.profile?.buyerTitles ?? [],
    signals: [],
    excludedDomains: input.profile?.excludedDomains ?? [],
  };
  const search = buildCompanySearch(profileForSearch, {
    size: target,
    extraExcludeDomains: input.extraExcludeDomains,
  });
  if ("error" in search) throw new Error(search.error);

  const companySearchBody = {
    ...search.body,
    size: target,
    fields: [...COMPANY_SEARCH_FIELDS],
  };

  const libraryId = await ensureTestLibrary(
    client,
    companySearchBody as Json,
    ["b2b_saas"],
  );

  let companyCreditsUsed = 0;
  let searchAfter: string | string[] | undefined;
  const allCompanyRows: Awaited<
    ReturnType<OceanClient["searchCompanies"]>
  >["companies"] = [];

  for (let page = 0; page < 3; page += 1) {
    const body: Record<string, unknown> = {
      ...companySearchBody,
      size: target,
    };
    if (searchAfter) body.searchAfter = searchAfter;

    const companyResponse = await ocean.searchCompanies(
      body,
      log(input.businessId),
    );
    companyCreditsUsed += companyResponse.creditsUsed ?? 0;
    allCompanyRows.push(...companyResponse.companies);
    searchAfter = companyResponse.searchAfter;
    if (!searchAfter || companyResponse.companies.length === 0) break;
  }

  if (allCompanyRows.length === 0) {
    throw new Error(
      "No lookalike companies found for your example clients. Try different seed websites.",
    );
  }

  const oceanValues = await loadOceanValuesBySlug(client);
  const persistResult = await persistCompanySearch(
    client,
    {
      companies: allCompanyRows,
      creditsUsed: companyCreditsUsed,
    },
    oceanValues,
    libraryId,
  );

  for (const companyId of persistResult.companyIdsByDomain.values()) {
    await client.from("business_lookalikes").upsert(
      {
        business_id: input.businessId,
        icp_id: input.icpId,
        company_id: companyId,
        similarity: null,
        seed_domain: seeds[0]!,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "icp_id,company_id" },
    );
  }

  const blocked = new Set(search.blocked);
  const sampleAccounts = toSampleAccounts(
    allCompanyRows.map((row) => unwrapOceanCompany(row)),
    blocked,
    target,
  ).filter((account) => persistResult.companyIdsByDomain.has(account.domain));

  // One Deepline pass. Do not refill with a second paid enrichment.
  const selected = sampleAccounts.slice(0, target);
  const buyerTitles =
    input.buyerTitles ??
    input.profile?.buyerTitles ??
    ["Founder", "CEO", "Owner"];

  const enriched = await enrichAccountsWithDeepline(
    selected.map((account) => ({
      name: account.name,
      domain: account.domain,
      linkedinCompanyUrl: account.linkedinCompanyUrl ?? null,
    })),
    buyerTitles,
  );
  if (!enriched.ok) {
    throw new Error(enriched.error);
  }

  type Finalist = {
    companyId: string;
    domain: string;
    contactId: string;
    account: (typeof selected)[number];
  };
  const finalists: Finalist[] = [];

  for (const account of selected) {
    if (finalists.length >= target) break;
    const companyId = persistResult.companyIdsByDomain.get(account.domain);
    if (!companyId) continue;

    const { data: already } = await client
      .from("drop_accounts")
      .select("id")
      .eq("business_id", input.businessId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (already) continue;

    const person = enriched.byDomain.get(account.domain) ?? null;
    if (!isDeliverableAccount(account, person) || !person?.contactName) continue;

    const contactId = await upsertDeeplineContact(client, companyId, {
      contactName: person.contactName,
      firstName: person.firstName,
      lastName: person.lastName,
      title: person.title,
      linkedinUrl: person.linkedinUrl,
      email: person.email,
    });
    finalists.push({ companyId, domain: account.domain, contactId, account });
  }

  if (finalists.length === 0) {
    throw new Error(
      "Found companies, but none had a decision-maker with a LinkedIn profile yet.",
    );
  }

  const scheduledFor = new Date();
  scheduledFor.setUTCHours(12, 0, 0, 0);

  const { data: existingDrop } = await client
    .from("drops")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("scheduled_for", scheduledFor.toISOString())
    .maybeSingle();

  let dropId = existingDrop?.id;
  const shortfall = Math.max(0, target - finalists.length);
  const shortfallNote =
    shortfall > 0
      ? `Found ${finalists.length} strong matches with decision-makers, not ${target}.`
      : null;

  const campaign = input.campaign ?? null;
  const content = buildCampaignContent({
    profile: {
      website: input.profile?.website ?? "",
      services: input.profile?.services ?? [],
      industries: input.profile?.industries ?? [],
      buyerTitles: input.buyerTitles ?? input.profile?.buyerTitles ?? [],
      regions: input.profile?.regions ?? [],
      caseStudies: [],
    },
    enriched: input.enriched ?? null,
    campaign: campaign
      ? {
          name: campaign.title,
          objective: campaign.objective,
          resourceUrl: campaign.supportingUrl,
        }
      : null,
  });

  if (!dropId) {
    const { data: drop, error } = await client
      .from("drops")
      .insert({
        business_id: input.businessId,
        icp_id: input.icpId,
        campaign_id: input.campaignId ?? null,
        audience_snapshot: input.audienceSnapshot ?? null,
        campaign_snapshot: input.campaignSnapshot ?? null,
        plan_id: input.planId ?? "starter",
        scheduled_for: scheduledFor.toISOString(),
        status: "delivered",
        target_count: target,
        delivered_count: finalists.length,
        shortfall,
        shortfall_note: shortfallNote,
        delivered_at: new Date().toISOString(),
        notified_at: null,
      })
      .select("id")
      .single();
    if (error || !drop) throw new Error(error?.message ?? "drop insert failed");
    dropId = drop.id;
  } else {
    await client
      .from("drops")
      .update({
        status: "delivered",
        campaign_id: input.campaignId ?? null,
        audience_snapshot: input.audienceSnapshot ?? null,
        campaign_snapshot: input.campaignSnapshot ?? null,
        target_count: target,
        delivered_count: finalists.length,
        shortfall,
        shortfall_note: shortfallNote,
        delivered_at: new Date().toISOString(),
        notified_at: null,
      })
      .eq("id", dropId);
  }

  // Persist reusable campaign content on the drop for this delivery.
  for (const [type, body, title, outline] of [
    ["linkedin_post", `${content.linkedinPost.hook}\n\n${content.linkedinPost.body}`, content.linkedinPost.hook, null],
    ["x_post", content.xPost.body, content.xPost.title, null],
    ["blog_idea", content.blogIdea.angle, content.blogIdea.title, content.blogIdea.outline],
  ] as const) {
    await client.from("drop_content").upsert(
      {
        drop_id: dropId,
        business_id: input.businessId,
        type,
        title,
        body,
        outline: outline as Json | null,
      },
      { onConflict: "drop_id,type" },
    );
  }

  const { data: ranked } = await client.rpc("deliverable_companies", {
    p_business_id: input.businessId,
    result_limit: 25,
  });

  let position = 1;
  const { data: maxPos } = await client
    .from("drop_accounts")
    .select("position")
    .eq("drop_id", dropId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxPos) position = maxPos.position + 1;

  let inserted = 0;
  for (const finalist of finalists) {
    const { data: company } = await client
      .from("companies")
      .select(
        "id, name, domain, industry_raw, employee_range, region, description",
      )
      .eq("id", finalist.companyId)
      .single();
    if (!company) continue;

    const { data: signal } = await client
      .from("company_signals")
      .select("id, title")
      .eq("company_id", finalist.companyId)
      .eq("type", "funding")
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: contact } = await client
      .from("contacts")
      .select("id, full_name, title, linkedin_url, email, email_status")
      .eq("id", finalist.contactId)
      .single();

    const fundingTitle =
      signal?.title ??
      (finalist.account.signal.trim() ? finalist.account.signal.trim() : null);

    const copy = buildCampaignAwareCopy({
      companyName: company.name,
      domain: company.domain,
      industryRaw: company.industry_raw,
      employeeRange: company.employee_range,
      region: company.region,
      contactName: contact?.full_name ?? null,
      contactTitle: contact?.title ?? null,
      fundingTitle,
      seedDomains: seeds,
      campaign,
    });

    const snapshot: Json = {
      company: {
        name: company.name,
        domain: company.domain,
        industry: company.industry_raw,
        employeeRange: company.employee_range,
        region: company.region,
        description: company.description,
      },
      signal: signal
        ? { id: signal.id, title: signal.title, type: "funding" }
        : fundingTitle
          ? { title: fundingTitle, type: "other" }
          : null,
      contact: contact
        ? {
            fullName: contact.full_name,
            title: contact.title,
            linkedinUrl: contact.linkedin_url,
            ...(contact.email_status === "verified" && contact.email
              ? { email: contact.email }
              : {}),
          }
        : null,
      fitReason: copy.fit_reason,
      outreachAngle: copy.outreach_angle,
      linkedinMessage: copy.linkedin_message,
      signalLabel: signalFromAccount(finalist.account, seeds),
    };

    const rankedRow = (ranked ?? []).find(
      (row) => row.company_id === finalist.companyId,
    );

    const { error } = await client.from("drop_accounts").insert({
      drop_id: dropId,
      business_id: input.businessId,
      company_id: finalist.companyId,
      contact_id: contact?.id ?? null,
      signal_id: signal?.id ?? null,
      position,
      score: rankedRow?.score ?? null,
      score_breakdown: rankedRow?.score_breakdown ?? null,
      fit_reason: copy.fit_reason,
      outreach_angle: copy.outreach_angle,
      linkedin_message: copy.linkedin_message,
      snapshot,
    });
    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") continue;
      throw new Error(error.message);
    }
    position += 1;
    inserted += 1;
  }

  const { count } = await client
    .from("drop_accounts")
    .select("id", { count: "exact", head: true })
    .eq("drop_id", dropId);

  const deliveredCount = count ?? inserted;
  const finalShortfall = Math.max(0, target - deliveredCount);
  await client
    .from("drops")
    .update({
      delivered_count: deliveredCount,
      shortfall: finalShortfall,
      shortfall_note:
        finalShortfall > 0
          ? `Found ${deliveredCount} strong matches with decision-makers, not ${target}.`
          : null,
    })
    .eq("id", dropId);

  return {
    dropId,
    deliveredCount,
    shortfall: finalShortfall,
    shortfallNote:
      finalShortfall > 0
        ? `Found ${deliveredCount} strong matches with decision-makers, not ${target}.`
        : null,
  };
}
