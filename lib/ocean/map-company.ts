import type { Database, Json } from "@/lib/supabase/database.types";
import type { OceanCompany } from "@/lib/ocean/schemas";

type EmployeeRange = Database["public"]["Enums"]["employee_range"];
type RegionCode = Database["public"]["Enums"]["region_code"];

export type MappedCompany = {
  domain: string;
  name: string;
  linkedin_url: string | null;
  description: string | null;
  industry_slug: string | null;
  industry_raw: string | null;
  employee_count: number | null;
  employee_range: EmployeeRange | null;
  hq_city: string | null;
  hq_state: string | null;
  hq_country_code: string | null;
  region: RegionCode | null;
  founded_year: number | null;
  technologies: string[];
  logo_url: string | null;
  source: "ocean";
  source_id: string;
  raw: Json;
  enriched_at: string;
};

export type MappedFundingSignal = {
  type: "funding";
  title: string;
  summary: string | null;
  source_url: string | null;
  occurred_at: string;
  source: "ocean";
  raw: Json;
};

const EUROPE_COUNTRIES = new Set([
  "at",
  "be",
  "bg",
  "ch",
  "cz",
  "de",
  "dk",
  "ee",
  "es",
  "fi",
  "fr",
  "gr",
  "hr",
  "hu",
  "it",
  "lt",
  "lu",
  "lv",
  "nl",
  "no",
  "pl",
  "pt",
  "ro",
  "se",
  "si",
  "sk",
]);

const LATAM_COUNTRIES = new Set([
  "mx",
  "br",
  "ar",
  "cl",
  "co",
  "pe",
  "uy",
  "cr",
]);

const APAC_COUNTRIES = new Set([
  "au",
  "nz",
  "sg",
  "jp",
  "in",
  "kr",
  "hk",
  "tw",
  "ph",
  "id",
  "my",
  "th",
  "vn",
]);

export function mapOceanCompanySize(
  size: string | undefined,
): EmployeeRange | null {
  if (!size) return null;
  switch (size) {
    case "0-1":
    case "2-10":
      return "1-10";
    case "11-50":
      return "11-50";
    case "51-200":
      return "51-200";
    case "201-500":
      return "201-500";
    case "501-1000":
      return "501-1000";
    case "1001-5000":
    case "5001-10000":
    case "10001-50000":
    case "50001-100000":
    case "100001-500000":
    case "500000+":
      return "1000+";
    default:
      return null;
  }
}

export function mapCountryToRegion(
  countryCode: string | null | undefined,
): RegionCode | null {
  if (!countryCode) return null;
  const code = countryCode.toLowerCase();
  if (code === "us" || code === "ca") return "north_america";
  if (code === "gb" || code === "ie") return "uk_ireland";
  if (EUROPE_COUNTRIES.has(code)) return "europe";
  if (APAC_COUNTRIES.has(code)) return "apac";
  if (LATAM_COUNTRIES.has(code)) return "latin_america";
  return null;
}

export function resolveIndustrySlug(
  oceanIndustries: string[] | undefined,
  oceanValuesBySlug: Map<string, string[]>,
): string | null {
  if (!oceanIndustries?.length) return null;
  const lower = new Set(oceanIndustries.map((value) => value.toLowerCase()));
  for (const [slug, values] of oceanValuesBySlug) {
    if (values.some((value) => lower.has(value.toLowerCase()))) {
      return slug;
    }
  }
  return null;
}

/**
 * Fill industries.ocean_values only when an Ocean industry string matches a
 * Shortlist industry label exactly (case-insensitive). Unmatched stay empty.
 */
export function exactIndustryOceanValues(
  shortlistIndustries: Array<{ slug: string; label: string }>,
  oceanIndustries: string[],
): Map<string, string[]> {
  const oceanByLower = new Map(
    oceanIndustries.map((value) => [value.toLowerCase(), value] as const),
  );
  const result = new Map<string, string[]>();
  for (const industry of shortlistIndustries) {
    const match = oceanByLower.get(industry.label.toLowerCase());
    result.set(industry.slug, match ? [match] : []);
  }
  return result;
}

function primaryLocation(company: OceanCompany) {
  const locations = company.locations ?? [];
  return (
    locations.find((location) => location.primary) ?? locations[0] ?? null
  );
}

export function mapOceanCompany(
  company: OceanCompany,
  oceanValuesBySlug: Map<string, string[]>,
): MappedCompany {
  const domain = company.domain.trim().toLowerCase();
  const location = primaryLocation(company);
  const country =
    location?.country?.toUpperCase() ??
    company.primaryCountry?.toUpperCase() ??
    null;
  const industries = company.industries ?? [];

  return {
    domain,
    name: company.name?.trim() || domain,
    linkedin_url: company.medias?.linkedin?.url ?? null,
    description: company.description ?? null,
    industry_slug: resolveIndustrySlug(industries, oceanValuesBySlug),
    industry_raw: industries.length > 0 ? industries.join(", ") : null,
    employee_count: company.employeeCountOcean ?? null,
    employee_range: mapOceanCompanySize(company.companySize),
    hq_city: location?.locality ?? null,
    hq_state: location?.regionCode ?? location?.region ?? location?.state ?? null,
    hq_country_code: country && /^[A-Z]{2}$/.test(country) ? country : null,
    region: mapCountryToRegion(country),
    founded_year: company.yearFounded ?? null,
    technologies: company.technologies ?? [],
    logo_url: company.logo ?? null,
    source: "ocean",
    source_id: domain,
    raw: company as unknown as Json,
    enriched_at: new Date().toISOString(),
  };
}

export function mapFundingSignal(
  company: OceanCompany,
): MappedFundingSignal | null {
  const round = company.fundingRound;
  if (!round?.date) return null;

  const amount =
    typeof round.moneyRaisedInUsd === "number"
      ? `$${round.moneyRaisedInUsd.toLocaleString("en-US")}`
      : null;
  const typeLabel = round.type ?? "Funding";
  const title = amount
    ? `${typeLabel} — ${amount}`
    : `${typeLabel} funding round`;

  return {
    type: "funding",
    title,
    summary: amount
      ? `${company.name ?? company.domain} raised ${amount} (${typeLabel}).`
      : `${company.name ?? company.domain} announced a ${typeLabel} round.`,
    source_url: round.cbUrl ?? null,
    occurred_at: round.date.slice(0, 10),
    source: "ocean",
    raw: round as unknown as Json,
  };
}

export const COMPANY_SEARCH_FIELDS = [
  "domain",
  "name",
  "companySize",
  "primaryCountry",
  "industries",
  "industryCategories",
  "description",
  "employeeCountOcean",
  "yearFounded",
  "logo",
  "technologies",
  "locations",
  "medias.linkedin",
  "fundingRound",
  "buyingSignals",
  "updatedAt",
] as const;
