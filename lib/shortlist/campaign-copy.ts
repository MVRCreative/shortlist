import { buildDropCopy } from '@/lib/ocean/map-person'

export type CampaignCopyContext = {
  title: string
  objective: string
  supportingUrl?: string | null
} | null

/**
 * Per-account outreach. Uses verified company/contact fields plus the campaign
 * objective. Never invents buying signals.
 */
export function buildCampaignAwareCopy(input: {
  companyName: string
  domain: string
  industryRaw: string | null
  employeeRange: string | null
  region: string | null
  contactName: string | null
  contactTitle: string | null
  fundingTitle: string | null
  seedDomains: string[]
  campaign: CampaignCopyContext
}): {
  fit_reason: string
  outreach_angle: string
  linkedin_message: string
} {
  const base = buildDropCopy({
    companyName: input.companyName,
    domain: input.domain,
    industryRaw: input.industryRaw,
    employeeRange: input.employeeRange,
    region: input.region,
    contactName: input.contactName,
    contactTitle: input.contactTitle,
    fundingTitle: input.fundingTitle,
    seedDomains: input.seedDomains,
  })

  if (!input.campaign) return base

  const firstName = input.contactName?.split(/\s+/)[0]?.trim() || null
  const objective = input.campaign.objective.trim()
  const url = input.campaign.supportingUrl?.trim()
  const isWebinar = /webinar|workshop|event|invite/i.test(objective)
  const signalBit = input.fundingTitle
    ? `Saw the ${input.fundingTitle}.`
    : `Your team looks similar to ${input.seedDomains.slice(0, 2).join(' and ') || 'companies we help'}.`

  const ask = isWebinar
    ? url
      ? `Would an invite to ${input.campaign.title} be useful? ${url}`
      : `Would an invite to ${input.campaign.title} be useful?`
    : url
      ? `Happy to share how this ties to ${input.campaign.title} (${url}) if helpful.`
      : `Happy to share how this ties to ${input.campaign.title} if helpful.`

  const body = `${signalBit} ${objective} ${ask}`.replace(/\s+/g, ' ').trim()
  const linkedin_message = firstName ? `Hey ${firstName} — ${body}` : body

  return {
    fit_reason: `${base.fit_reason} Relevant to campaign “${input.campaign.title}”.`,
    outreach_angle: isWebinar
      ? `Invite them to ${input.campaign.title} using the campaign objective. Do not invent attendance interest.`
      : `Open with the campaign objective for “${input.campaign.title}”. Do not invent a buying signal.`,
    linkedin_message,
  }
}
