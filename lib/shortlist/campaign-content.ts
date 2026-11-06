import type { Digest, EnrichedProfile, ProfileInput } from '@/lib/shortlist/schemas'

/** A campaign the member is running. Absent today; the generator is ready for one. */
export type CampaignBrief = {
  name: string
  objective: string
  resourceUrl?: string | null
  resourceLabel?: string | null
}

export type CampaignProfile = Pick<
  ProfileInput,
  'companyName' | 'website' | 'services' | 'industries' | 'buyerTitles' | 'regions' | 'caseStudies'
> & {
  description?: string | null
}

export type CampaignAssetId = 'linkedinPost' | 'xPost' | 'blogIdea'

export type CampaignContent = {
  /** Stable across weekly digests. Changes when the profile, audience, or campaign changes. */
  sourceKey: string
  campaignName: string | null
  intro: string
  linkedinPost: { purpose: string; hook: string; body: string }
  xPost: { purpose: string; title: string; body: string }
  blogIdea: { purpose: string; title: string; angle: string; outline: string[] }
}

/** Only the fields a member has changed. Missing fields stay on the generated copy. */
export type CampaignCopyDraft = {
  sourceKey: string
  published: CampaignAssetId[]
  linkedinHook?: string
  linkedinBody?: string
  xTitle?: string
  xBody?: string
  blogTitle?: string
  blogAngle?: string
  /** Newline-separated outline. Empty string clears the outline. */
  blogOutline?: string
}

export type CampaignCopyPatch = Partial<Omit<CampaignCopyDraft, 'sourceKey' | 'published'>>

const STORAGE_KEY = 'shortlist:campaign-content:v1'

const DEFAULT_INTRO = 'From your profile and audience. You publish these yourself.'

export function buildCampaignContent(args: {
  profile: CampaignProfile
  enriched?: EnrichedProfile | null
  campaign?: CampaignBrief | null
}): CampaignContent {
  const profile = args.profile
  const enriched = args.enriched ?? null
  const campaign = args.campaign ?? null
  const company = clean(profile.companyName) || 'your business'
  const service = first(profile.services, null) ?? clean(enriched?.category) ?? 'the work'
  const industry = first(profile.industries, null) ?? first(enriched?.icp.industries, null) ?? 'the businesses you want'
  const buyer = first(profile.buyerTitles, null) ?? first(enriched?.icp.buyerTitles, null) ?? 'the buyer'
  const pain = first(enriched?.painsSolved, null)
  const difference = first(enriched?.differentiators, null)
  const offer = campaign ? resourceLine(campaign) : null

  const hook = campaign
    ? sentence(campaign.objective)
    : pain ?? `What ${buyer.toLowerCase()}s deal with before they hire ${lower(service)}.`

  const linkedinBody = [
    campaign ? null : clean(enriched?.oneLiner),
    servicesLine(company, profile.services),
    pain && !hook.includes(pain) ? `The part that stalls: ${pain}` : null,
    difference ? `What is different: ${difference}` : null,
    offer,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n\n')

  const xBody = clip(
    [sentence(hook), offer].filter((line): line is string => Boolean(line)).join(' '),
    270,
  )

  const articleTitle = campaign
    ? campaign.name
    : pain
      ? sentence(pain)
      : `${service} for a ${buyer.toLowerCase()}`

  const outline = [
    `About ${service}`,
    `Who it is for: ${buyer} in ${industry}`,
    pain ? `The problem: ${pain}` : `Where ${lower(service)} starts`,
    difference ? `How it is different: ${difference}` : `What ${company} does`,
  ]

  return {
    sourceKey: campaignSourceKey(profile, enriched, campaign),
    campaignName: campaign ? clean(campaign.name) || null : null,
    intro: campaign
      ? `For ${clean(campaign.name) || 'this campaign'}. You publish these yourself.`
      : DEFAULT_INTRO,
    linkedinPost: {
      purpose: `A point of view for a ${buyer} in ${industry}, based on what ${company} actually does.`,
      hook,
      body: linkedinBody,
    },
    xPost: {
      purpose: 'The same point, short enough for X.',
      title: campaign ? clean(campaign.name) || service : service,
      body: xBody,
    },
    blogIdea: {
      purpose: 'An article idea from your offer and audience. Outline only, not a finished piece.',
      title: articleTitle,
      angle: clean(enriched?.valueProp) || servicesLine(company, profile.services) || hook,
      outline,
    },
  }
}

/** Same inputs, ignoring the week and which accounts were selected. */
export function campaignSourceKey(
  profile: CampaignProfile,
  enriched: EnrichedProfile | null,
  campaign: CampaignBrief | null,
): string {
  return JSON.stringify({
    company: clean(profile.companyName),
    website: clean(profile.website ?? ''),
    services: profile.services,
    industries: profile.industries,
    buyers: profile.buyerTitles,
    regions: profile.regions,
    oneLiner: clean(enriched?.oneLiner ?? ''),
    pains: enriched?.painsSolved ?? [],
    differences: enriched?.differentiators ?? [],
    value: clean(enriched?.valueProp ?? ''),
    campaign: campaign
      ? {
          name: clean(campaign.name),
          objective: clean(campaign.objective),
          url: clean(campaign.resourceUrl ?? ''),
        }
      : null,
  })
}

export function isThinCampaignProfile(profile: CampaignProfile): boolean {
  return (
    !clean(profile.companyName) &&
    !clean(profile.website ?? '') &&
    profile.services.length === 0 &&
    profile.industries.length === 0 &&
    profile.buyerTitles.length === 0
  )
}

/**
 * Profile-backed copy when we know the business. Digest-embedded copy when the
 * client profile is empty, which is the case for a digest loaded from Supabase.
 */
export function resolveCampaignContent(args: {
  profile: CampaignProfile
  enriched: EnrichedProfile | null
  campaign?: CampaignBrief | null
  digest: Digest | null
}): CampaignContent {
  if (args.digest && isThinCampaignProfile(args.profile)) return campaignContentFromDigest(args.digest)
  return buildCampaignContent(args)
}

export function campaignContentFromDigest(digest: Digest): CampaignContent {
  return {
    sourceKey: `digest:${digest.theme}:${digest.linkedinPost.hook}`,
    campaignName: null,
    intro: DEFAULT_INTRO,
    linkedinPost: {
      purpose: 'A post from this digest. You publish it yourself.',
      hook: digest.linkedinPost.hook,
      body: digest.linkedinPost.body,
    },
    xPost: {
      purpose: 'The same point, short enough for X.',
      title: 'X post',
      body: digest.xPost,
    },
    blogIdea: {
      purpose: 'An article idea. Outline only, not a finished piece.',
      title: digest.blogIdea.title,
      angle: digest.blogIdea.angle,
      outline: digest.blogIdea.outline,
    },
  }
}

export function applyCampaignDraft(content: CampaignContent, draft: CampaignCopyDraft | null): CampaignContent {
  if (!draft || draft.sourceKey !== content.sourceKey) return content
  return {
    ...content,
    linkedinPost: {
      ...content.linkedinPost,
      hook: draft.linkedinHook ?? content.linkedinPost.hook,
      body: draft.linkedinBody ?? content.linkedinPost.body,
    },
    xPost: {
      ...content.xPost,
      title: draft.xTitle ?? content.xPost.title,
      body: draft.xBody ?? content.xPost.body,
    },
    blogIdea: {
      ...content.blogIdea,
      title: draft.blogTitle ?? content.blogIdea.title,
      angle: draft.blogAngle ?? content.blogIdea.angle,
      outline:
        draft.blogOutline === undefined
          ? content.blogIdea.outline
          : draft.blogOutline.split('\n').map((line) => line.trim()).filter(Boolean),
    },
  }
}

export function readCampaignDraft(sourceKey: string): CampaignCopyDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CampaignCopyDraft
    if (!parsed || parsed.sourceKey !== sourceKey || !Array.isArray(parsed.published)) return null
    return parsed
  } catch {
    return null
  }
}

export function writeCampaignDraft(draft: CampaignCopyDraft) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

function servicesLine(company: string, services: string[]): string | null {
  const list = services.map(clean).filter(Boolean)
  if (list.length === 0) return null
  if (list.length === 1) return `${company} offers ${list[0]}.`
  return `${company} offers ${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}.`
}

function resourceLine(campaign: CampaignBrief): string | null {
  const url = clean(campaign.resourceUrl ?? '')
  if (!url) return null
  const label = clean(campaign.resourceLabel ?? '') || 'Details'
  return `${label}: ${url}`
}

function first(values: string[] | undefined, fallback: string | null): string | null {
  const value = values?.map(clean).find(Boolean)
  return value || fallback
}

function sentence(value: string): string {
  const text = clean(value)
  if (!text) return ''
  return /[.!?]$/.test(text) ? text : `${text}.`
}

function lower(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1)
}

function clip(value: string, max: number): string {
  const text = clean(value)
  if (text.length <= max) return text
  const sliced = text.slice(0, max - 1)
  const word = sliced.lastIndexOf(' ')
  return `${(word > 40 ? sliced.slice(0, word) : sliced).trimEnd()}…`
}

function clean(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}
