/**
 * Deliver a real Shortlist drop (up to 10 accounts + decision-makers) for an
 * existing authenticated customer. Uses Ocean for companies/people; never
 * fabricates emails.
 *
 * Usage:
 *   pnpm ocean:deliver -- --email user@example.com --seeds stripe.com,notion.so
 */
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv, resetServerEnvCacheForTests } from "@/lib/env";
import { OceanApiError, OceanClient } from "@/lib/ocean/client";
import { creditTotal } from "@/lib/ocean/schemas";
import {
  COMPANY_SEARCH_FIELDS,
  exactIndustryOceanValues,
} from "@/lib/ocean/map-company";
import { buildDropCopy, mapOceanPerson } from "@/lib/ocean/map-person";
import {
  ensureTestLibrary,
  loadOceanValuesBySlug,
  logProviderCall,
  persistCompanySearch,
  syncIndustryOceanValues,
  upsertContact,
  type ServiceClient,
} from "@/lib/ocean/persist";
import type { Database, Json } from "@/lib/supabase/database.types";

loadEnv({ path: ".env.local", override: true });
loadEnv({ override: false });

const TARGET = 10;

type CliArgs = {
  email: string;
  seeds: string[];
};

function parseArgs(argv: string[]): CliArgs {
  let email = "";
  const seeds: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--email") {
      email = (argv[++i] ?? "").trim().toLowerCase();
      continue;
    }
    if (arg === "--seeds") {
      const value = argv[++i] ?? "";
      seeds.push(
        ...value
          .split(",")
          .map((p) => p.trim().toLowerCase())
          .filter(Boolean),
      );
    }
  }
  if (!email.includes("@")) {
    throw new Error("--email user@example.com is required");
  }
  if (seeds.length < 2 || seeds.length > 3) {
    throw new Error("--seeds requires 2–3 domains");
  }
  return { email, seeds };
}

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

async function resolveCustomer(
  client: ServiceClient,
  email: string,
): Promise<{ userId: string; businessId: string; icpId: string }> {
  const { data: listed, error } = await client.auth.admin.listUsers({
    perPage: 1000,
  });
  if (error) throw new Error(error.message);
  const user = listed.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) {
    throw new Error(
      `No auth user for ${email}. Sign up in the app first, then re-run.`,
    );
  }

  const { data: business, error: bErr } = await client
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (bErr) throw new Error(bErr.message);
  if (!business) {
    throw new Error(
      `No business for ${email}. Sign in once so bootstrap can create it.`,
    );
  }

  const { data: icp, error: iErr } = await client
    .from("icps")
    .select("id")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .maybeSingle();
  if (iErr) throw new Error(iErr.message);
  if (!icp) throw new Error(`No active ICP for ${email}`);

  // Ensure seeds exist for lookalike ranking context.
  return { userId: user.id, businessId: business.id, icpId: icp.id };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seeds = args.seeds.map(normalizeDomain);
  resetServerEnvCacheForTests();
  const env = getServerEnv();
  const client = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const ocean = new OceanClient(env.OCEAN_API_TOKEN);
  const report: Record<string, unknown> = {
    email: args.email,
    seeds,
    blockers: [] as string[],
  };

  const log =
    (businessId?: string) =>
    async (meta: Parameters<typeof logProviderCall>[1]) => {
      await logProviderCall(client, { ...meta, businessId });
    };

  console.log("1) Credits…");
  const balance = await ocean.getCreditBalance(log());
  const companyCredits = creditTotal(balance.credits);
  // Up to 30 companies + 10 people ≈ 8 credits worst case for this script.
  if (companyCredits < 8) {
    throw new Error(`Need ≥8 company credits, have ${companyCredits}`);
  }
  report.creditsBefore = {
    company: companyCredits,
    email: creditTotal(balance.emailCredits),
  };
  console.log(`   company=${companyCredits}`);

  console.log("2) Resolve customer…");
  const customer = await resolveCustomer(client, args.email);
  report.customer = customer;
  console.log(`   business=${customer.businessId}`);

  // Sync seeds onto ICP (max 3)
  const { data: existingSeeds } = await client
    .from("icp_seed_accounts")
    .select("domain")
    .eq("icp_id", customer.icpId);
  const have = new Set((existingSeeds ?? []).map((r) => r.domain));
  for (const seed of seeds) {
    if (have.has(seed) || have.size >= 3) continue;
    await client.from("icp_seed_accounts").insert({
      icp_id: customer.icpId,
      domain: seed,
    });
    have.add(seed);
  }

  console.log("3) Industry map + company search…");
  const dataFields = await ocean.getDataFields(log(customer.businessId));
  const { data: industries } = await client
    .from("industries")
    .select("slug, label");
  await syncIndustryOceanValues(
    client,
    exactIndustryOceanValues(industries ?? [], dataFields.industries),
  );

  const companySearchBody = {
    size: TARGET,
    fields: [...COMPANY_SEARCH_FIELDS],
    companiesFilters: {
      lookalikeDomains: seeds,
      excludeDomains: seeds,
      companySizes: ["11-50", "51-200", "201-500"],
      primaryLocations: { includeCountries: ["us", "ca"] },
    },
  };

  const libraryId = await ensureTestLibrary(
    client,
    companySearchBody as Json,
    ["b2b_saas"],
  );

  // Pull up to 3 pages so people-search yield can still hit TARGET.
  let companyCreditsUsed = 0;
  let searchAfter: string | string[] | undefined;
  const allCompanyRows: Awaited<
    ReturnType<OceanClient["searchCompanies"]>
  >["companies"] = [];

  for (let page = 0; page < 3; page += 1) {
    const body: Record<string, unknown> = {
      ...companySearchBody,
      size: TARGET,
    };
    if (searchAfter) body.searchAfter = searchAfter;

    const companyResponse = await ocean.searchCompanies(
      body,
      log(customer.businessId),
    );
    companyCreditsUsed += companyResponse.creditsUsed ?? 0;
    allCompanyRows.push(...companyResponse.companies);
    searchAfter = companyResponse.searchAfter;
    if (!searchAfter || companyResponse.companies.length === 0) break;
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
  report.companies = {
    returned: allCompanyRows.length,
    creditsUsed: companyCreditsUsed,
    upserted: persistResult.upserted,
  };
  console.log(`   companies=${allCompanyRows.length}`);

  // Lookalikes for ranking
  for (const companyId of persistResult.companyIdsByDomain.values()) {
    await client.from("business_lookalikes").upsert(
      {
        business_id: customer.businessId,
        icp_id: customer.icpId,
        company_id: companyId,
        similarity: null,
        seed_domain: seeds[0]!,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "icp_id,company_id" },
    );
  }

  console.log("4) People search per company (size=1)…");
  type Finalist = {
    companyId: string;
    domain: string;
    contactId: string;
    personName: string;
  };
  const finalists: Finalist[] = [];
  let peopleCredits = 0;

  for (const [domain, companyId] of persistResult.companyIdsByDomain) {
    if (finalists.length >= TARGET) break;

    // Skip if already delivered to this business
    const { data: already } = await client
      .from("drop_accounts")
      .select("id")
      .eq("business_id", customer.businessId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (already) continue;

    try {
      const people = await ocean.searchPeople(
        {
          size: 1,
          peopleFilters: {
            seniorities: ["C-Level", "VP", "Director", "Head", "Owner"],
          },
          companiesFilters: { includeDomains: [domain] },
        },
        log(customer.businessId),
      );
      peopleCredits += people.creditsUsed ?? 0.2;
      const person = people.people[0];
      if (!person) {
        console.warn(`   no person for ${domain}`);
        continue;
      }
      const contactId = await upsertContact(
        client,
        mapOceanPerson(person, companyId),
      );
      finalists.push({
        companyId,
        domain,
        contactId,
        personName: person.name ?? person.id,
      });
      console.log(`   + ${domain} → ${person.name ?? person.id}`);
    } catch (err) {
      if (err instanceof OceanApiError && err.status === 402) {
        (report.blockers as string[]).push("402 on people search — stopping");
        break;
      }
      throw err;
    }
  }

  report.finalists = finalists.map((f) => ({
    domain: f.domain,
    person: f.personName,
  }));
  report.peopleCreditsUsed = peopleCredits;

  if (finalists.length === 0) {
    throw new Error("No companies with decision-makers — aborting drop");
  }

  console.log(`5) Writing drop (${finalists.length} accounts)…`);
  const scheduledFor = new Date();
  scheduledFor.setUTCHours(12, 0, 0, 0);

  // Prefer a fresh scheduled_for if today's drop exists with different count
  const { data: existingDrop } = await client
    .from("drops")
    .select("id")
    .eq("business_id", customer.businessId)
    .eq("scheduled_for", scheduledFor.toISOString())
    .maybeSingle();

  let dropId = existingDrop?.id;
  const shortfall = Math.max(0, TARGET - finalists.length);
  if (!dropId) {
    const { data: drop, error } = await client
      .from("drops")
      .insert({
        business_id: customer.businessId,
        icp_id: customer.icpId,
        plan_id: "starter",
        scheduled_for: scheduledFor.toISOString(),
        status: "delivered",
        target_count: TARGET,
        delivered_count: finalists.length,
        shortfall,
        shortfall_note:
          shortfall > 0
            ? `Found ${finalists.length} strong matches with decision-makers, not ${TARGET}.`
            : null,
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
        target_count: TARGET,
        delivered_count: finalists.length,
        shortfall,
        shortfall_note:
          shortfall > 0
            ? `Found ${finalists.length} strong matches with decision-makers, not ${TARGET}.`
            : null,
        delivered_at: new Date().toISOString(),
        notified_at: null,
      })
      .eq("id", dropId);
  }

  const { data: ranked } = await client.rpc("deliverable_companies", {
    p_business_id: customer.businessId,
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

    const copy = buildDropCopy({
      companyName: company.name,
      domain: company.domain,
      industryRaw: company.industry_raw,
      employeeRange: company.employee_range,
      region: company.region,
      contactName: contact?.full_name ?? null,
      contactTitle: contact?.title ?? null,
      fundingTitle: signal?.title ?? null,
      seedDomains: seeds,
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

    const rankedRow = (ranked ?? []).find(
      (r) => r.company_id === finalist.companyId,
    );

    const { error } = await client.from("drop_accounts").insert({
      drop_id: dropId,
      business_id: customer.businessId,
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
      if (error.message.includes("duplicate") || error.code === "23505") {
        console.warn(`   skip duplicate ${finalist.domain}`);
        continue;
      }
      throw new Error(error.message);
    }
    position += 1;
    inserted += 1;
  }

  // Refresh delivered_count from actual rows
  const { count } = await client
    .from("drop_accounts")
    .select("id", { count: "exact", head: true })
    .eq("drop_id", dropId);
  await client
    .from("drops")
    .update({
      delivered_count: count ?? inserted,
      shortfall: Math.max(0, TARGET - (count ?? inserted)),
    })
    .eq("id", dropId);

  report.drop = {
    dropId,
    inserted,
    deliveredCount: count ?? inserted,
    emailsFabricated: false,
    emailReveal: "skipped — no email credits / not requested",
  };

  console.log("\n=== Deliver report ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
