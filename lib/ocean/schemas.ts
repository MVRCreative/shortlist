import { z } from "zod";

const creditBucketSchema = z.object({
  oneTime: z.number().optional(),
  recurrent: z.number().optional(),
});

export const oceanCreditBalanceSchema = z.object({
  credits: creditBucketSchema.optional(),
  emailCredits: creditBucketSchema.optional(),
  phoneCredits: creditBucketSchema.optional(),
  previewCredits: creditBucketSchema.optional(),
  dailyLimitRateLeft: z.number().optional(),
  dailyLimitRateSecondsToReset: z.number().optional(),
});

export type OceanCreditBalance = z.infer<typeof oceanCreditBalanceSchema>;

const mediaSchema = z
  .object({
    url: z.string().optional(),
    handle: z.string().optional(),
    name: z.string().optional(),
  })
  .passthrough();

const locationSchema = z
  .object({
    primary: z.boolean().optional(),
    country: z.string().optional(),
    locality: z.string().optional(),
    region: z.string().optional(),
    regionCode: z.string().optional(),
    state: z.string().optional(),
  })
  .passthrough();

const fundingRoundSchema = z
  .object({
    date: z.string().optional(),
    type: z.string().optional(),
    moneyRaisedInUsd: z.number().optional(),
    cbUrl: z.string().optional(),
  })
  .passthrough();

export const oceanCompanySchema = z
  .object({
    domain: z.string().min(1),
    name: z.string().optional(),
    companySize: z.string().optional(),
    primaryCountry: z.string().optional(),
    industries: z.array(z.string()).optional(),
    industryCategories: z.array(z.string()).optional(),
    description: z.string().optional(),
    employeeCountOcean: z.number().optional(),
    employeeCountLinkedin: z.number().optional(),
    yearFounded: z.number().optional(),
    logo: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    locations: z.array(locationSchema).optional(),
    medias: z
      .object({
        linkedin: mediaSchema.optional(),
      })
      .passthrough()
      .optional(),
    fundingRound: fundingRoundSchema.optional().nullable(),
    buyingSignals: z.array(z.unknown()).optional(),
    relevance: z.enum(["A", "B", "C"]).optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type OceanCompany = z.infer<typeof oceanCompanySchema>;

const companyResultSchema = z
  .object({
    company: oceanCompanySchema.optional(),
    domain: z.string().optional(),
    name: z.string().optional(),
    relevance: z.enum(["A", "B", "C"]).optional(),
  })
  .passthrough();

export const oceanCompanySearchResponseSchema = z.object({
  companies: z.array(companyResultSchema).default([]),
  searchAfter: z.union([z.string(), z.array(z.string())]).optional(),
  total: z.number().optional(),
  creditsUsed: z.number().optional(),
  missingDomains: z.record(z.unknown()).optional(),
  redirectMap: z.record(z.string()).optional(),
  detail: z.string().optional(),
});

export type OceanCompanySearchResponse = z.infer<
  typeof oceanCompanySearchResponseSchema
>;

export const oceanPersonSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    jobTitle: z.string().optional(),
    jobTitleEnglish: z.string().optional(),
    seniorities: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
    domain: z.string().optional(),
    linkedinUrl: z.string().optional(),
    country: z.string().optional(),
  })
  .passthrough();

export type OceanPerson = z.infer<typeof oceanPersonSchema>;

export const oceanPeopleSearchResponseSchema = z.object({
  people: z.array(oceanPersonSchema).default([]),
  searchAfter: z.union([z.string(), z.array(z.string())]).optional(),
  total: z.number().optional(),
  creditsUsed: z.number().optional(),
  detail: z.string().optional(),
});

export type OceanPeopleSearchResponse = z.infer<
  typeof oceanPeopleSearchResponseSchema
>;

export const oceanRevealEmailsResponseSchema = z.object({
  status: z.enum(["in progress", "webhook sent"]).or(z.string()),
});

export const oceanRevealWebhookSchema = z.object({
  results: z.array(
    z.object({
      personId: z.string(),
      email: z
        .object({
          address: z.string().nullable().optional(),
          status: z.string(),
        })
        .optional(),
    }),
  ),
});

export type OceanRevealWebhook = z.infer<typeof oceanRevealWebhookSchema>;

const oceanIndustryGroupSchema = z
  .object({
    industryCategory: z.string().optional(),
    industries: z.array(z.string()).optional(),
  })
  .passthrough();

export const oceanDataFieldsSchema = z
  .object({
    // Ocean returns industry taxonomy as category groups, not a flat string[].
    industries: z.array(oceanIndustryGroupSchema).optional(),
  })
  .passthrough();

export function flattenOceanIndustryLabels(
  groups: Array<{ industries?: string[] }> | undefined,
): string[] {
  if (!groups?.length) return [];
  const labels = new Set<string>();
  for (const group of groups) {
    for (const label of group.industries ?? []) {
      if (label.trim()) labels.add(label);
    }
  }
  return [...labels];
}

export function unwrapOceanCompany(
  row: z.infer<typeof companyResultSchema>,
): OceanCompany {
  if (row.company) {
    return {
      ...row.company,
      relevance: row.company.relevance ?? row.relevance,
    };
  }
  return oceanCompanySchema.parse(row);
}

export function creditTotal(
  bucket: { oneTime?: number; recurrent?: number } | undefined,
): number {
  if (!bucket) return 0;
  return (bucket.oneTime ?? 0) + (bucket.recurrent ?? 0);
}
