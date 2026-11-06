import { enrichAccountsWithDeepline, type DeeplineEnrichment } from '@/lib/deepline/enrich-accounts'
import { buildCampaignContent } from '@/lib/shortlist/campaign-content'
import { buildCampaignAwareCopy, type CampaignCopyContext } from '@/lib/shortlist/campaign-copy'
import { deeplineBatchSize } from '@/lib/shortlist/entitlements'
import { findNewAccountsFromOcean } from '@/lib/shortlist/ocean-match'
import type { Digest, EnrichedProfile, ProfileInput, SampleAccount } from '@/lib/shortlist/schemas'
import { normalizeDomain } from '@/lib/shortlist/url'

const WEEKLY_CAP = 10

export function domainsToSkip(input: {
  website: string
  seedClients: readonly string[]
  excludedDomains: readonly string[]
  reviewedDomains: readonly string[]
  priorDomains: readonly string[]
}): string[] {
  const seen = new Set<string>()
  const domains: string[] = []
  for (const value of [
    input.website,
    ...input.seedClients,
    ...input.excludedDomains,
    ...input.reviewedDomains,
    ...input.priorDomains,
  ]) {
    const domain = normalizeDomain(value)
    if (!domain || seen.has(domain)) continue
    seen.add(domain)
    domains.push(domain)
  }
  return domains
}

/** An account only ships when we have a real person and a way to reach them. */
export function isDeliverableAccount(
  account: SampleAccount,
  enrichment: DeeplineEnrichment | null | undefined,
): boolean {
  const name = enrichment?.contactName?.trim()
  const title = enrichment?.title?.trim()
  const linkedin = enrichment?.linkedinUrl?.trim()
  const domain = account.domain?.trim()
  const company = account.name?.trim()
  return Boolean(name && title && linkedin && domain && company)
}

export function signalFromAccount(account: SampleAccount, seedDomains: string[]): string {
  if (account.signal.trim()) return account.signal.trim()
  const seeds = seedDomains.slice(0, 3).join(', ') || 'your best-fit clients'
  return `Looks like ${seeds} (${account.industry}, ${account.employees}, ${account.location})`
}

export function leadFromAccount(
  account: SampleAccount,
  enrichment: DeeplineEnrichment | null,
  seedDomains: string[],
  campaign: CampaignCopyContext = null,
): Digest['leads'][number] | null {
  if (!isDeliverableAccount(account, enrichment)) return null
  const contact = enrichment!
  const copy = buildCampaignAwareCopy({
    companyName: account.name,
    domain: account.domain,
    industryRaw: account.industry,
    employeeRange: account.employees,
    region: account.location,
    contactName: contact.contactName,
    contactTitle: contact.title,
    fundingTitle: account.signal.trim() || null,
    seedDomains,
    campaign,
  })
  const signal = signalFromAccount(account, seedDomains)

  return {
    contactName: contact.contactName!,
    title: contact.title!,
    company: account.name,
    domain: account.domain,
    email: contact.email,
    linkedinUrl: contact.linkedinUrl,
    signal,
    fitReason: copy.fit_reason,
    angle: copy.outreach_angle,
    message: copy.linkedin_message,
  }
}

function themeFor(leads: Digest['leads'], target: number, campaign: CampaignCopyContext): string {
  const count = leads.length
  if (count < target) return `Found ${count} strong matches this week, not ${target}.`
  if (campaign) return campaign.title
  return `${count} accounts this week`
}

/**
 * OpenAI profile is already done. Ocean selects candidates.
 * Deepline enriches only that selection — once, capped at plan size (max 10).
 * Incomplete contacts are dropped. No second paid pass to fill the batch.
 */
export async function buildLiveDigest(args: {
  input: ProfileInput
  enriched: EnrichedProfile
  fits: SampleAccount[]
  misses: SampleAccount[]
  priorDomains: string[]
  leadsPerDigest: number
  campaign?: CampaignCopyContext
}): Promise<{ ok: true; digest: Digest; source: 'ocean' } | { ok: false; error: string }> {
  if (args.fits.length === 0) {
    return { ok: false, error: 'Mark at least one account as a fit before building the digest.' }
  }

  const target = deeplineBatchSize(args.leadsPerDigest)
  const found = await findNewAccountsFromOcean(args.input, {
    target,
    extraExcludeDomains: domainsToSkip({
      website: args.input.website,
      seedClients: args.input.seedClients,
      excludedDomains: args.input.excludedDomains,
      reviewedDomains: [...args.fits, ...args.misses].map((account) => account.domain),
      priorDomains: args.priorDomains,
    }),
  })
  if (!found.ok) return found

  // One Deepline pass only. Cap at plan size / 10. Do not over-fetch to refill.
  const selected = found.accounts.slice(0, target)
  const buyerTitles =
    args.input.buyerTitles.length > 0 ? args.input.buyerTitles : args.enriched.icp.buyerTitles
  const enriched = await enrichAccountsWithDeepline(
    selected.map((account) => ({
      name: account.name,
      domain: account.domain,
      linkedinCompanyUrl: account.linkedinCompanyUrl ?? null,
    })),
    buyerTitles,
  )
  if (!enriched.ok) return enriched

  const campaign = args.campaign ?? null
  const leads = selected
    .map((account) =>
      leadFromAccount(
        account,
        enriched.byDomain.get(account.domain) ?? null,
        args.input.seedClients,
        campaign,
      ),
    )
    .filter((lead): lead is Digest['leads'][number] => lead !== null)
    .slice(0, target)

  if (leads.length === 0) {
    return {
      ok: false,
      error:
        'Found lookalike companies, but none had a decision-maker with a LinkedIn profile yet. Try again or broaden your size and region.',
    }
  }

  const content = buildCampaignContent({
    profile: args.input,
    enriched: args.enriched,
    campaign: campaign
      ? {
          name: campaign.title,
          objective: campaign.objective,
          resourceUrl: campaign.supportingUrl,
        }
      : null,
  })

  return {
    ok: true,
    source: 'ocean',
    digest: {
      theme: themeFor(leads, target, campaign),
      leads,
      linkedinPost: { hook: content.linkedinPost.hook, body: content.linkedinPost.body },
      xPost: content.xPost.body,
      blogIdea: {
        title: content.blogIdea.title,
        angle: content.blogIdea.angle,
        outline: content.blogIdea.outline,
      },
    },
  }
}

export { WEEKLY_CAP }
