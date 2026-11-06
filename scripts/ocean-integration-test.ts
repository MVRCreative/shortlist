import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv, resetServerEnvCacheForTests } from "@/lib/env";
import {
  assertEnoughCredits,
  OceanApiError,
  OceanClient,
} from "@/lib/ocean/client";
import {
  COMPANY_SEARCH_FIELDS,
  exactIndustryOceanValues,
} from "@/lib/ocean/map-company";
import { buildDropCopy, mapOceanPerson } from "@/lib/ocean/map-person";
import {
  ensureTestLibrary,
  FIXTURE_EMAIL,
  loadOceanValuesBySlug,
  logProviderCall,
  persistCompanySearch,
  syncIndustryOceanValues,
  upsertContact,
  type ServiceClient,
} from "@/lib/ocean/persist";
import type { Database, Json } from "@/lib/supabase/database.types";

// Prefer .env.local; override empty shell placeholders so server env parsing works.
loadEnv({ path: ".env.local", override: true });
loadEnv({ override: false });

const MAX_COMPANY_SIZE = 10;
const WEBHOOK_WAIT_MS = 5 * 60 * 1000;
const WEBHOOK_POLL_MS = 5_000;

type CliArgs = {
  seeds: string[];
  size: number;
  skipReveal: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const seeds: string[] = [];
  let size = MAX_COMPANY_SIZE;
  let skipReveal = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--seeds") {
      const value = argv[i + 1];
      if (!value) throw new Error("--seeds requires a comma-separated list");
      seeds.push(
        ...value
          .split(",")
          .map((part) => part.trim().toLowerCase())
          .filter(Boolean),
      );
      i += 1;
      continue;
    }
    if (arg === "--size") {
      const value = Number.parseInt(argv[i + 1] ?? "", 10);
      if (!Number.isFinite(value) || value < 1 || value > MAX_COMPANY_SIZE) {
        throw new Error(`--size must be between 1 and ${MAX_COMPANY_SIZE}`);
      }
      size = value;
      i += 1;
      continue;
    }
    if (arg === "--skip-reveal") {
      skipReveal = true;
      continue;
    }
  }

  if (seeds.length < 2 || seeds.length > 3) {
    throw new Error(
      "Provide 2–3 seed domains via --seeds domain1.com,domain2.com[,domain3.com]",
    );
  }

  return { seeds, size, skipReveal };
}

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

async function ensureFixture(
  client: ServiceClient,
  seeds: string[],
): Promise<{
  businessId: string;
  audienceId: string;
  userId: string;
}> {
  const { data: listed, error: listError } =
    await client.auth.admin.listUsers({ perPage: 200 });
  if (listError) {
    throw new Error(`listUsers failed: ${listError.message}`);
  }

  let userId = listed.users.find((user) => user.email === FIXTURE_EMAIL)?.id;

  if (!userId) {
    const { data: created, error: createError } =
      await client.auth.admin.createUser({
        email: FIXTURE_EMAIL,
        email_confirm: true,
        password: crypto.randomUUID(),
        user_metadata: { full_name: "Ocean Integration Test" },
      });
    if (createError || !created.user) {
      throw new Error(`createUser failed: ${createError?.message}`);
    }
    userId = created.user.id;
  }

  const { data: existingBusiness, error: businessSelectError } = await client
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (businessSelectError) {
    throw new Error(`businesses select failed: ${businessSelectError.message}`);
  }

  let businessId = existingBusiness?.id;
  if (!businessId) {
    const { data, error } = await client
      .from("businesses")
      .insert({
        owner_id: userId,
        website_domain: "shortlist.local",
        name: "Ocean Test Studio",
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

  const { data: existingIcp, error: icpSelectError } = await client
    .from("audiences")
    .select("id")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .maybeSingle();
  if (icpSelectError) {
    throw new Error(`audiences select failed: ${icpSelectError.message}`);
  }

  let audienceId = existingIcp?.id;
  if (!audienceId) {
    const { data, error } = await client
      .from("audiences")
      .insert({
        business_id: businessId,
        lineage_id: crypto.randomUUID(),
        version: 1,
        is_active: true,
        is_primary: true,
        name: "Primary audience",
        industry_slugs: ["b2b_saas"],
        employee_ranges: ["11-50", "51-200", "201-500"],
        regions: ["north_america"],
        buyer_titles: ["Head of Marketing", "VP Marketing", "CMO"],
        signal_types: ["funding"],
      })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(`audiences insert failed: ${error?.message}`);
    }
    audienceId = data.id;
  } else {
    const { error } = await client
      .from("audiences")
      .update({
        industry_slugs: ["b2b_saas"],
        employee_ranges: ["11-50", "51-200", "201-500"],
        regions: ["north_america"],
        buyer_titles: ["Head of Marketing", "VP Marketing", "CMO"],
        signal_types: ["funding"],
      })
      .eq("id", audienceId);
    if (error) throw new Error(`audiences update failed: ${error.message}`);
  }

  const { data: existingSeeds, error: seedsSelectError } = await client
    .from("audience_seeds")
    .select("domain")
    .eq("audience_id", audienceId);
  if (seedsSelectError) {
    throw new Error(`audience_seeds select failed: ${seedsSelectError.message}`);
  }
  const have = new Set((existingSeeds ?? []).map((row) => row.domain));
  for (const seed of seeds) {
    if (have.has(seed)) continue;
    if (have.size >= 3) break;
    const { error } = await client.from("audience_seeds").insert({
      audience_id: audienceId,
      domain: seed,
    });
    if (error) {
      throw new Error(`audience_seeds insert failed: ${error.message}`);
    }
    have.add(seed);
  }

  const { data: existingSub, error: subSelectError } = await client
    .from("subscriptions")
    .select("id")
    .eq("business_id", businessId)
    .in("status", ["trialing", "active", "past_due"])
    .maybeSingle();
  if (subSelectError) {
    throw new Error(`subscriptions select failed: ${subSelectError.message}`);
  }
  if (!existingSub) {
    const { error } = await client.from("subscriptions").insert({
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

  return { businessId, audienceId, userId };
}

async function waitForVerifiedEmail(
  client: ServiceClient,
  contactId: string,
): Promise<{ verified: boolean; email: string | null; status: string }> {
  const deadline = Date.now() + WEBHOOK_WAIT_MS;
  while (Date.now() < deadline) {
    const { data, error } = await client
      .from("contacts")
      .select("email, email_status, raw")
      .eq("id", contactId)
      .single();
    if (error) throw new Error(`contacts poll failed: ${error.message}`);

    if (data.email_status === "verified" && data.email) {
      return { verified: true, email: data.email, status: "verified" };
    }

    const raw =
      data.raw && typeof data.raw === "object"
        ? (data.raw as Record<string, unknown>)
        : null;
    const reveal =
      raw && typeof raw.emailReveal === "object" && raw.emailReveal
        ? (raw.emailReveal as { status?: string; address?: string | null })
        : null;
    if (reveal?.status && reveal.status !== "pending") {
      return {
        verified: false,
        email: null,
        status: reveal.status,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, WEBHOOK_POLL_MS));
  }
  return { verified: false, email: null, status: "timeout" };
}

async function ensureLookalikes(
  client: ServiceClient,
  businessId: string,
  audienceId: string,
  companyIds: string[],
  seedDomain: string,
): Promise<void> {
  for (const companyId of companyIds) {
    const { error } = await client.from("audience_lookalikes").upsert(
      {
        business_id: businessId,
        audience_id: audienceId,
        company_id: companyId,
        similarity: null,
        seed_domain: seedDomain,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "audience_id,company_id" },
    );
    if (error) {
      throw new Error(`audience_lookalikes upsert failed: ${error.message}`);
    }
  }
}

async function ensureTestDrop(input: {
  client: ServiceClient;
  businessId: string;
  audienceId: string;
  preferredCompanyId: string;
  contactId: string | null;
  seedDomains: string[];
}): Promise<{
  dropId: string;
  dropAccountId: string;
  created: boolean;
  companyId: string;
}> {
  const { client, businessId, audienceId, preferredCompanyId, contactId, seedDomains } =
    input;

  const { data: existingAccount, error: existingError } = await client
    .from("drop_accounts")
    .select("id, drop_id, company_id")
    .eq("business_id", businessId)
    .eq("company_id", preferredCompanyId)
    .maybeSingle();
  if (existingError) {
    throw new Error(`drop_accounts select failed: ${existingError.message}`);
  }
  if (existingAccount) {
    return {
      dropId: existingAccount.drop_id,
      dropAccountId: existingAccount.id,
      created: false,
      companyId: existingAccount.company_id,
    };
  }

  const { data: ranked, error: rankError } = await client.rpc(
    "deliverable_companies",
    {
      p_business_id: businessId,
      result_limit: 10,
    },
  );
  if (rankError) {
    throw new Error(`deliverable_companies failed: ${rankError.message}`);
  }

  const rankedIds = (ranked ?? []).map((row) => row.company_id);
  const companyId = rankedIds.includes(preferredCompanyId)
    ? preferredCompanyId
    : (rankedIds[0] ?? preferredCompanyId);

  const { data: company, error: companyError } = await client
    .from("companies")
    .select(
      "id, name, domain, industry_raw, employee_range, region, description",
    )
    .eq("id", companyId)
    .single();
  if (companyError || !company) {
    throw new Error(`company fetch failed: ${companyError?.message}`);
  }

  const { data: signal } = await client
    .from("company_signals")
    .select("id, title")
    .eq("company_id", companyId)
    .eq("type", "funding")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let contact:
    | {
        id: string;
        full_name: string;
        title: string | null;
        linkedin_url: string | null;
        email: string | null;
        email_status: string;
      }
    | null = null;

  if (contactId) {
    const { data } = await client
      .from("contacts")
      .select("id, full_name, title, linkedin_url, email, email_status")
      .eq("id", contactId)
      .maybeSingle();
    contact = data;
  }

  const copy = buildDropCopy({
    companyName: company.name,
    domain: company.domain,
    industryRaw: company.industry_raw,
    employeeRange: company.employee_range,
    region: company.region,
    contactName: contact?.full_name ?? null,
    contactTitle: contact?.title ?? null,
    fundingTitle: signal?.title ?? null,
    seedDomains,
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
  };

  const scheduledFor = new Date();
  scheduledFor.setUTCHours(12, 0, 0, 0);

  const { data: drop, error: dropError } = await client
    .from("drops")
    .upsert(
      {
        business_id: businessId,
        audience_id: audienceId,
        plan_id: "starter",
        scheduled_for: scheduledFor.toISOString(),
        status: "delivered",
        target_count: 1,
        delivered_count: 1,
        shortfall: 0,
        delivered_at: new Date().toISOString(),
        notified_at: null,
      },
      { onConflict: "business_id,scheduled_for" },
    )
    .select("id")
    .single();
  if (dropError || !drop) {
    throw new Error(`drops upsert failed: ${dropError?.message}`);
  }

  const rankedRow = (ranked ?? []).find((row) => row.company_id === companyId);

  const { data: dropAccount, error: dropAccountError } = await client
    .from("drop_accounts")
    .insert({
      drop_id: drop.id,
      business_id: businessId,
      company_id: companyId,
      contact_id: contact?.id ?? null,
      signal_id: signal?.id ?? null,
      position: 1,
      score: rankedRow?.score ?? null,
      score_breakdown: rankedRow?.score_breakdown ?? null,
      fit_reason: copy.fit_reason,
      outreach_angle: copy.outreach_angle,
      linkedin_message: copy.linkedin_message,
      snapshot,
    })
    .select("id")
    .single();
  if (dropAccountError || !dropAccount) {
    throw new Error(`drop_accounts insert failed: ${dropAccountError?.message}`);
  }

  return {
    dropId: drop.id,
    dropAccountId: dropAccount.id,
    created: true,
    companyId,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const seeds = args.seeds.map(normalizeDomain);

  resetServerEnvCacheForTests();
  const env = getServerEnv();
  const client = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const ocean = new OceanClient(env.OCEAN_API_TOKEN);

  const report: Record<string, unknown> = {
    seeds,
    size: args.size,
    blockers: [] as string[],
  };

  const metaLogger = (businessId?: string) => async (
    meta: Parameters<typeof logProviderCall>[1],
  ) => {
    await logProviderCall(client, { ...meta, businessId });
  };

  console.log("1) Checking Ocean credit balance…");
  let canReveal = false;
  const balance = await ocean.getCreditBalance(metaLogger());
  try {
    const credits = assertEnoughCredits(balance);
    canReveal = credits.canReveal;
    report.creditsBefore = credits;
    console.log(
      `   company=${credits.companyCredits} email=${credits.emailCredits} dailyLeft=${credits.dailyLeft} canReveal=${canReveal}`,
    );
    if (!canReveal) {
      (report.blockers as string[]).push(
        `Insufficient email credits for one reveal (have ${credits.emailCredits}, need ≥ 1) — skipping reveal`,
      );
      console.warn("   skipping email reveal (no email credits)");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    (report.blockers as string[]).push(message);
    console.error(`BLOCKER: ${message}`);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  console.log("2) Syncing industry ocean_values (exact label matches only)…");
  const dataFields = await ocean.getDataFields(metaLogger());
  const { data: industries, error: industriesError } = await client
    .from("industries")
    .select("slug, label");
  if (industriesError) {
    throw new Error(industriesError.message);
  }
  const valuesBySlug = exactIndustryOceanValues(
    industries ?? [],
    dataFields.industries,
  );
  const industryUpdates = await syncIndustryOceanValues(client, valuesBySlug);
  report.industryOceanValuesUpdated = industryUpdates;
  console.log(`   updated ${industryUpdates} industry mapping(s)`);

  const fixture = await ensureFixture(client, seeds);
  report.fixture = {
    businessId: fixture.businessId,
    audienceId: fixture.audienceId,
    email: FIXTURE_EMAIL,
  };
  console.log(`3) Fixture ready business=${fixture.businessId}`);

  const companySearchBody = {
    size: args.size,
    fields: [...COMPANY_SEARCH_FIELDS],
    companiesFilters: {
      lookalikeDomains: seeds,
      excludeDomains: seeds,
      companySizes: ["11-50", "51-200", "201-500"],
      primaryLocations: {
        includeCountries: ["us", "ca"],
      },
    },
  };

  const libraryId = await ensureTestLibrary(
    client,
    companySearchBody as Json,
    ["b2b_saas"],
  );
  report.libraryId = libraryId;

  console.log(`4) Searching companies (size=${args.size})…`);
  let companyResponse;
  try {
    companyResponse = await ocean.searchCompanies(
      companySearchBody,
      metaLogger(fixture.businessId),
    );
  } catch (err) {
    if (err instanceof OceanApiError && err.status === 402) {
      (report.blockers as string[]).push("402 Insufficient credits on company search");
      console.log(JSON.stringify(report, null, 2));
      process.exit(1);
    }
    throw err;
  }

  if (
    companyResponse.missingDomains &&
    Object.keys(companyResponse.missingDomains).length > 0
  ) {
    (report.blockers as string[]).push(
      `missingDomains: ${JSON.stringify(companyResponse.missingDomains)}`,
    );
    console.warn("   missingDomains:", companyResponse.missingDomains);
  }

  const oceanValues = await loadOceanValuesBySlug(client);
  const persistResult = await persistCompanySearch(
    client,
    companyResponse,
    oceanValues,
    libraryId,
  );
  report.companies = {
    returned: companyResponse.companies.length,
    total: companyResponse.total ?? null,
    creditsUsed: companyResponse.creditsUsed ?? null,
    upserted: persistResult.upserted,
    skippedNonOcean: persistResult.skippedNonOcean,
    fundingSignalsInserted: persistResult.fundingSignalsInserted,
  };
  console.log(
    `   returned=${companyResponse.companies.length} upserted=${persistResult.upserted} fundingSignals=${persistResult.fundingSignalsInserted}`,
  );

  if (persistResult.companyIdsByDomain.size === 0) {
    (report.blockers as string[]).push("No companies persisted from Ocean search");
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const companyIds = [...persistResult.companyIdsByDomain.values()];
  await ensureLookalikes(
    client,
    fixture.businessId,
    fixture.audienceId,
    companyIds,
    seeds[0]!,
  );

  // Prefer a company with funding signal as finalist; else first returned.
  let finalistDomain = [...persistResult.companyIdsByDomain.keys()][0]!;
  let finalistCompanyId = persistResult.companyIdsByDomain.get(finalistDomain)!;
  for (const [domain, companyId] of persistResult.companyIdsByDomain) {
    const { data: signal } = await client
      .from("company_signals")
      .select("id")
      .eq("company_id", companyId)
      .eq("type", "funding")
      .limit(1)
      .maybeSingle();
    if (signal) {
      finalistDomain = domain;
      finalistCompanyId = companyId;
      break;
    }
  }
  report.finalist = { domain: finalistDomain, companyId: finalistCompanyId };
  console.log(`5) Finalist ${finalistDomain}`);

  console.log("6) Searching one person at finalist…");
  const peopleBody = {
    size: 1,
    peopleFilters: {
      seniorities: ["C-Level", "VP", "Director", "Head"],
    },
    companiesFilters: {
      includeDomains: [finalistDomain],
    },
  };
  const peopleResponse = await ocean.searchPeople(
    peopleBody,
    metaLogger(fixture.businessId),
  );
  const person = peopleResponse.people[0] ?? null;
  report.people = {
    returned: peopleResponse.people.length,
    creditsUsed: peopleResponse.creditsUsed ?? null,
    personId: person?.id ?? null,
    name: person?.name ?? null,
  };

  let contactId: string | null = null;
  if (person) {
    contactId = await upsertContact(
      client,
      mapOceanPerson(person, finalistCompanyId),
    );
    report.contactId = contactId;
    console.log(`   person=${person.name ?? person.id} contactId=${contactId}`);
  } else {
    (report.blockers as string[]).push(
      "People search returned 0 contacts for finalist",
    );
    console.warn("   no person found");
  }

  let revealStatus = "skipped";
  if (person && contactId && !args.skipReveal && !canReveal) {
    revealStatus = "skipped_no_email_credits";
  } else if (person && contactId && !args.skipReveal && canReveal) {
    console.log("7) Revealing email (async webhook)…");
    const webhookUrl = `${env.OCEAN_WEBHOOK_BASE_URL.replace(/\/$/, "")}/functions/v1/ocean-reveal?secret=${encodeURIComponent(env.OCEAN_WEBHOOK_SECRET)}`;
    try {
      // Mark pending so the poller can distinguish "not yet" from "never".
      await client
        .from("contacts")
        .update({
          raw: {
            ...(person as object),
            emailReveal: { status: "pending" },
          },
        })
        .eq("id", contactId);

      const reveal = await ocean.revealEmails(
        [person.id],
        webhookUrl,
        metaLogger(fixture.businessId),
      );
      report.revealAccepted = reveal.status;
      console.log(`   reveal accepted status=${reveal.status}`);

      const wait = await waitForVerifiedEmail(client, contactId);
      revealStatus = wait.status;
      report.reveal = wait;
      console.log(
        `   reveal result status=${wait.status} verified=${wait.verified}`,
      );
      if (wait.status === "timeout") {
        (report.blockers as string[]).push(
          "Email reveal webhook timed out after ~5 minutes",
        );
      }
    } catch (err) {
      if (err instanceof OceanApiError && err.status === 402) {
        revealStatus = "402";
        (report.blockers as string[]).push(
          "402 Insufficient email credits on reveal",
        );
      } else {
        throw err;
      }
    }
  } else if (args.skipReveal) {
    revealStatus = "skipped_by_flag";
  }

  console.log("8) Writing one unnotified test drop…");
  const drop = await ensureTestDrop({
    client,
    businessId: fixture.businessId,
    audienceId: fixture.audienceId,
    preferredCompanyId: finalistCompanyId,
    contactId,
    seedDomains: seeds,
  });
  report.drop = { ...drop, revealStatus };
  console.log(
    `   dropId=${drop.dropId} dropAccountId=${drop.dropAccountId} created=${drop.created}`,
  );

  const { count: companyCount } = await client
    .from("companies")
    .select("id", { count: "exact", head: true })
    .eq("source", "ocean");
  const { count: providerCount } = await client
    .from("provider_calls")
    .select("id", { count: "exact", head: true })
    .eq("provider", "ocean");

  report.totals = {
    oceanCompanies: companyCount,
    oceanProviderCalls: providerCount,
  };

  console.log("\n=== Ocean integration test report ===");
  console.log(JSON.stringify(report, null, 2));

  if (
    (report.blockers as string[]).some((b) =>
      b.startsWith("No companies") || b.startsWith("402 Insufficient company"),
    )
  ) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
