import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { OceanRequestMeta } from "@/lib/ocean/client";
import {
  mapFundingSignal,
  mapOceanCompany,
  type MappedCompany,
} from "@/lib/ocean/map-company";
import type { MappedContact } from "@/lib/ocean/map-person";
import {
  unwrapOceanCompany,
  type OceanCompanySearchResponse,
} from "@/lib/ocean/schemas";

export type ServiceClient = SupabaseClient<Database>;

export const TEST_LIBRARY_SLUG = "ocean-test";
export const FIXTURE_EMAIL = "ocean-test@shortlist.local";

export async function logProviderCall(
  client: ServiceClient,
  meta: OceanRequestMeta & {
    businessId?: string | null;
    dropId?: string | null;
  },
): Promise<void> {
  const { error } = await client.from("provider_calls").insert({
    provider: "ocean",
    endpoint: meta.endpoint,
    business_id: meta.businessId ?? null,
    drop_id: meta.dropId ?? null,
    credits_used: meta.creditsUsed,
    status_code: meta.statusCode,
    duration_ms: meta.durationMs,
    error: meta.error,
  });
  if (error) {
    throw new Error(`provider_calls insert failed: ${error.message}`);
  }
}

export async function syncIndustryOceanValues(
  client: ServiceClient,
  valuesBySlug: Map<string, string[]>,
): Promise<number> {
  let updated = 0;
  for (const [slug, oceanValues] of valuesBySlug) {
    if (oceanValues.length === 0) continue;
    const { error } = await client
      .from("industries")
      .update({ ocean_values: oceanValues })
      .eq("slug", slug);
    if (error) {
      throw new Error(`industries update failed for ${slug}: ${error.message}`);
    }
    updated += 1;
  }
  return updated;
}

export async function loadOceanValuesBySlug(
  client: ServiceClient,
): Promise<Map<string, string[]>> {
  const { data, error } = await client
    .from("industries")
    .select("slug, ocean_values")
    .eq("is_active", true);
  if (error) throw new Error(`industries select failed: ${error.message}`);
  return new Map(
    (data ?? []).map((row) => [row.slug, row.ocean_values ?? []] as const),
  );
}

export async function ensureTestLibrary(
  client: ServiceClient,
  sourceQuery: Json,
  industrySlugs: string[],
): Promise<string> {
  const { data: existing, error: selectError } = await client
    .from("libraries")
    .select("id")
    .eq("slug", TEST_LIBRARY_SLUG)
    .maybeSingle();
  if (selectError) {
    throw new Error(`libraries select failed: ${selectError.message}`);
  }

  if (existing) {
    const { error } = await client
      .from("libraries")
      .update({
        name: "Ocean test library",
        industry_slugs: industrySlugs,
        source_query: sourceQuery,
        status: "active",
        target_size: 10,
        last_refreshed_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw new Error(`libraries update failed: ${error.message}`);
    return existing.id;
  }

  const { data, error } = await client
    .from("libraries")
    .insert({
      slug: TEST_LIBRARY_SLUG,
      name: "Ocean test library",
      industry_slugs: industrySlugs,
      source_query: sourceQuery,
      status: "active",
      target_size: 10,
      last_refreshed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`libraries insert failed: ${error?.message}`);
  }
  return data.id;
}

export type PersistCompaniesResult = {
  upserted: number;
  skippedNonOcean: string[];
  companyIdsByDomain: Map<string, string>;
  fundingSignalsInserted: number;
};

export async function persistCompanySearch(
  client: ServiceClient,
  response: OceanCompanySearchResponse,
  oceanValuesBySlug: Map<string, string[]>,
  libraryId: string,
): Promise<PersistCompaniesResult> {
  const skippedNonOcean: string[] = [];
  const companyIdsByDomain = new Map<string, string>();
  let upserted = 0;
  let fundingSignalsInserted = 0;

  for (const row of response.companies) {
    const oceanCompany = unwrapOceanCompany(row);
    const mapped: MappedCompany = mapOceanCompany(
      oceanCompany,
      oceanValuesBySlug,
    );

    const { data: existing, error: existingError } = await client
      .from("companies")
      .select("id, source")
      .eq("domain", mapped.domain)
      .maybeSingle();
    if (existingError) {
      throw new Error(`companies select failed: ${existingError.message}`);
    }

    if (existing && existing.source !== "ocean") {
      skippedNonOcean.push(mapped.domain);
      companyIdsByDomain.set(mapped.domain, existing.id);
      continue;
    }

    let companyId: string;
    if (existing) {
      const { data, error } = await client
        .from("companies")
        .update(mapped)
        .eq("id", existing.id)
        .select("id")
        .single();
      if (error || !data) {
        throw new Error(`companies update failed: ${error?.message}`);
      }
      companyId = data.id;
    } else {
      const { data, error } = await client
        .from("companies")
        .insert(mapped)
        .select("id")
        .single();
      if (error || !data) {
        throw new Error(`companies insert failed: ${error?.message}`);
      }
      companyId = data.id;
    }

    companyIdsByDomain.set(mapped.domain, companyId);
    upserted += 1;

    const { error: linkError } = await client.from("library_companies").upsert(
      {
        library_id: libraryId,
        company_id: companyId,
        is_active: true,
      },
      { onConflict: "library_id,company_id" },
    );
    if (linkError) {
      throw new Error(`library_companies upsert failed: ${linkError.message}`);
    }

    const signal = mapFundingSignal(oceanCompany);
    if (signal) {
      const { data: existingSignal, error: signalSelectError } = await client
        .from("company_signals")
        .select("id")
        .eq("company_id", companyId)
        .eq("type", "funding")
        .eq("occurred_at", signal.occurred_at)
        .maybeSingle();
      if (signalSelectError) {
        throw new Error(
          `company_signals select failed: ${signalSelectError.message}`,
        );
      }
      if (!existingSignal) {
        const { error: signalInsertError } = await client
          .from("company_signals")
          .insert({
            company_id: companyId,
            ...signal,
          });
        if (signalInsertError) {
          throw new Error(
            `company_signals insert failed: ${signalInsertError.message}`,
          );
        }
        fundingSignalsInserted += 1;
      }
    }
  }

  return {
    upserted,
    skippedNonOcean,
    companyIdsByDomain,
    fundingSignalsInserted,
  };
}

export async function upsertContact(
  client: ServiceClient,
  contact: MappedContact,
): Promise<string> {
  const { data: existing, error: selectError } = await client
    .from("contacts")
    .select("id")
    .eq("source", "ocean")
    .eq("source_id", contact.source_id)
    .maybeSingle();
  if (selectError) {
    throw new Error(`contacts select failed: ${selectError.message}`);
  }

  if (existing) {
    const { data, error } = await client
      .from("contacts")
      .update({
        company_id: contact.company_id,
        full_name: contact.full_name,
        first_name: contact.first_name,
        last_name: contact.last_name,
        title: contact.title,
        seniority: contact.seniority,
        department: contact.department,
        linkedin_url: contact.linkedin_url,
        raw: contact.raw,
      })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(`contacts update failed: ${error?.message}`);
    }
    return data.id;
  }

  const { data, error } = await client
    .from("contacts")
    .insert(contact)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`contacts insert failed: ${error?.message}`);
  }
  return data.id;
}

export async function applyVerifiedEmail(
  client: ServiceClient,
  personId: string,
  email: string,
  rawStatus: string,
): Promise<boolean> {
  if (rawStatus !== "verified") {
    // Keep non-verified statuses in raw only; do not set contacts.email.
    const { data: existing } = await client
      .from("contacts")
      .select("id, raw")
      .eq("source", "ocean")
      .eq("source_id", personId)
      .maybeSingle();
    if (existing) {
      const prev =
        existing.raw && typeof existing.raw === "object"
          ? (existing.raw as Record<string, unknown>)
          : {};
      await client
        .from("contacts")
        .update({
          raw: {
            ...prev,
            emailReveal: { status: rawStatus, address: email || null },
          },
        })
        .eq("id", existing.id);
    }
    return false;
  }

  const { data, error } = await client
    .from("contacts")
    .update({
      email,
      email_status: "verified",
      email_verified_at: new Date().toISOString(),
    })
    .eq("source", "ocean")
    .eq("source_id", personId)
    .select("id")
    .maybeSingle();
  if (error) {
    throw new Error(`verified email update failed: ${error.message}`);
  }
  return Boolean(data);
}
