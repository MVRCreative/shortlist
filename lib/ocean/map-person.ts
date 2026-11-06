import type { Json } from "@/lib/supabase/database.types";
import type { OceanPerson } from "@/lib/ocean/schemas";

export type MappedContact = {
  company_id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  seniority: string | null;
  department: string | null;
  linkedin_url: string | null;
  email: null;
  email_status: "unknown";
  source: "ocean";
  source_id: string;
  raw: Json;
};

export function mapOceanPerson(
  person: OceanPerson,
  companyId: string,
): MappedContact {
  const fullName =
    person.name?.trim() ||
    [person.firstName, person.lastName].filter(Boolean).join(" ").trim() ||
    "Unknown contact";

  return {
    company_id: companyId,
    full_name: fullName,
    first_name: person.firstName ?? null,
    last_name: person.lastName ?? null,
    title: person.jobTitleEnglish ?? person.jobTitle ?? null,
    seniority: person.seniorities?.[0] ?? null,
    department: person.departments?.[0] ?? null,
    linkedin_url: person.linkedinUrl ?? null,
    email: null,
    email_status: "unknown",
    source: "ocean",
    source_id: person.id,
    raw: person as unknown as Json,
  };
}

export function buildDropCopy(input: {
  companyName: string;
  domain: string;
  industryRaw: string | null;
  employeeRange: string | null;
  region: string | null;
  contactName: string | null;
  contactTitle: string | null;
  fundingTitle: string | null;
  seedDomains: string[];
}): {
  fit_reason: string;
  outreach_angle: string;
  linkedin_message: string;
} {
  const sizeBit = input.employeeRange
    ? `${input.employeeRange} employees`
    : "a similar company size";
  const industryBit = input.industryRaw ?? "your target industries";
  const regionBit = input.region ? ` in ${input.region.replaceAll("_", " ")}` : "";
  const seeds = input.seedDomains.slice(0, 3).join(", ");

  const fit_reason = input.fundingTitle
    ? `${input.companyName} matches your ICP (${industryBit}, ${sizeBit}${regionBit}) and has a dated funding event: ${input.fundingTitle}.`
    : `${input.companyName} matches your ICP (${industryBit}, ${sizeBit}${regionBit}) via lookalike similarity to ${seeds || "your seed accounts"}. No dated buying event was available for this account.`;

  const outreach_angle = input.fundingTitle
    ? `Reference the recent ${input.fundingTitle} and connect it to the work you do for companies like ${seeds || "your best customers"}.`
    : `Lead with relevance to ${seeds || "your seed accounts"} and ask about their current priorities. Do not invent a buying signal.`;

  const firstName = input.contactName?.split(/\s+/)[0]?.trim() || null;
  const signalBit = input.fundingTitle
    ? `Saw the ${input.fundingTitle} — curious how that shapes priorities for the next few months.`
    : `Curious whether outbound or positioning support is on your radar right now.`;
  const titleBit = input.contactTitle
    ? ` Your role as ${input.contactTitle} stood out.`
    : "";
  const body = `I work with companies similar to ${seeds || input.domain}.${titleBit} ${input.companyName} fits the profile of teams we help most (${industryBit}, ${sizeBit}). ${signalBit} Happy to share a short relevant example if useful.`;
  const linkedin_message = firstName
    ? `Hey ${firstName} — ${body}`
    : body;

  return { fit_reason, outreach_angle, linkedin_message };
}
