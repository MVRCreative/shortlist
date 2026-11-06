'use server'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { buildLiveDigest } from '@/lib/shortlist/live-digest'
import { matchAccountsFromOcean } from '@/lib/shortlist/ocean-match'
import { aiErrorMessage, profileModel } from '@/lib/shortlist/openai'
import { dealSizeLabel } from '@/lib/shortlist/profile-options'
import { readWebsiteProfile, type WebsiteRead } from '@/lib/shortlist/read-website'
import { studioName } from '@/lib/shortlist/url'
import {
  contentChannels,
  enrichedProfileSchema,
  profileInputSchema,
  sampleAccountSchema,
  type Digest,
  type EnrichedProfile,
  type ProfileInput,
  type SampleAccount,
} from '@/lib/shortlist/schemas'

export type DataSource = 'ai' | 'demo' | 'ocean'
type Result<T> = { ok: true; data: T; source: DataSource } | { ok: false; error: string }

function describeProfile(input: ProfileInput, enriched?: EnrichedProfile) {
  return [
    `Studio: ${studioName(input)} (${input.website})`,
    `Services: ${input.services.join(', ')}`,
    input.caseStudies.length > 0 && `Case studies: ${input.caseStudies.join(', ')}`,
    `Clients they want more of (lookalike seeds): ${input.seedClients.join(', ')}`,
    `Target industries: ${input.industries.join(', ')}`,
    `Client company sizes (employees): ${input.companySizes.join(', ')}`,
    `Regions: ${input.regions.join(', ')}`,
    `Decision makers: ${input.buyerTitles.join(', ')}`,
    input.signals.length > 0 && `Prioritize accounts showing: ${input.signals.join(', ')}`,
    input.dealSize && `Typical project size: ${dealSizeLabel(input.dealSize)}`,
    input.excludedDomains.length > 0 && `Never include these domains: ${input.excludedDomains.join(', ')}`,
    enriched && `Enriched profile: ${JSON.stringify(enriched)}`,
  ]
    .filter(Boolean)
    .join('\n')
}

const readRequestSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  website: z.string().trim().min(3).max(253),
})

export async function readStudioWebsite(raw: {
  companyName: string
  website: string
}): Promise<Result<WebsiteRead>> {
  const parsed = readRequestSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Enter a company name and website.' }
  const result = await readWebsiteProfile(parsed.data)
  if (!result.ok) return result
  return { ok: true, data: result.data, source: 'ai' }
}

export async function enrichProfile(raw: ProfileInput): Promise<Result<EnrichedProfile>> {
  const parsed = profileInputSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Some profile fields are missing.' }
  const input = parsed.data

  try {
    const { output } = await generateText({
      model: profileModel(),
      output: Output.object({ schema: enrichedProfileSchema }),
      providerOptions: { openai: { reasoningEffort: 'low' } },
      system:
        'You write a go-to-market profile from the inputs the user confirmed. Use their industries, buyers, regions, and seed clients as given. Be concrete, avoid buzzwords, never invent metrics or clients.',
      prompt: describeProfile(input),
    })
    return { ok: true, data: output, source: 'ai' }
  } catch (error) {
    return { ok: false, error: aiErrorMessage(error, "Couldn't build the profile. Try again.") }
  }
}

export async function findSampleAccounts(
  rawInput: ProfileInput,
  rawEnriched: EnrichedProfile,
): Promise<Result<SampleAccount[]>> {
  const input = profileInputSchema.safeParse(rawInput)
  const enriched = enrichedProfileSchema.safeParse(rawEnriched)
  if (!input.success || !enriched.success) return { ok: false, error: 'Profile is incomplete.' }

  const matched = await matchAccountsFromOcean(input.data)
  if (!matched.ok) return matched
  return { ok: true, data: matched.accounts, source: 'ocean' }
}

const digestRequestSchema = z.object({
  input: profileInputSchema,
  enriched: enrichedProfileSchema,
  fits: z.array(sampleAccountSchema.extend({ id: z.string() })).max(10),
  misses: z.array(sampleAccountSchema.extend({ id: z.string() })).max(10),
  priorDomains: z.array(z.string().trim().max(253)).max(200).default([]),
  leadsPerDigest: z.number().int().min(1).max(25),
  channels: z.array(z.enum(contentChannels)),
  week: z.number().int().min(0),
  campaign: z
    .object({
      title: z.string().trim().min(1).max(120),
      objective: z.string().trim().min(1).max(2000),
      supportingUrl: z.string().trim().max(500).nullable().optional(),
    })
    .nullable()
    .optional(),
})

export async function generateDigest(raw: z.infer<typeof digestRequestSchema>): Promise<Result<Digest>> {
  const parsed = digestRequestSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid digest settings.' }
  const args = parsed.data

  try {
    const built = await buildLiveDigest({
      input: args.input,
      enriched: args.enriched,
      fits: args.fits,
      misses: args.misses,
      priorDomains: args.priorDomains,
      leadsPerDigest: args.leadsPerDigest,
      campaign: args.campaign
        ? {
            title: args.campaign.title,
            objective: args.campaign.objective,
            supportingUrl: args.campaign.supportingUrl ?? null,
          }
        : null,
    })
    if (!built.ok) return built
    return { ok: true, data: built.digest, source: 'ocean' }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error'
    console.warn('[shortlist] generateDigest', detail)
    return { ok: false, error: `Couldn't build the digest: ${detail}` }
  }
}

const audienceConfirmSchema = z.object({
  input: profileInputSchema,
  enriched: enrichedProfileSchema.nullable(),
  reviews: z
    .array(
      z.object({
        domain: z.string(),
        verdict: z.enum(['fit', 'nofit']),
        name: z.string().optional(),
      }),
    )
    .max(25),
  markComplete: z.boolean().default(true),
})

/** Persist the business profile + primary audience for the signed-in member. */
export async function persistOnboardingState(
  raw: z.infer<typeof audienceConfirmSchema>,
): Promise<{ ok: true; businessId: string; audienceId: string; lineageId: string } | { ok: false; error: string }> {
  const parsed = audienceConfirmSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Profile is incomplete.' }

  const { createClient } = await import('@/lib/supabase/server')
  const {
    upsertBusinessProfile,
    upsertPrimaryAudience,
    saveAudienceReviews,
  } = await import('@/lib/shortlist/persist-profile')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sign in to save your profile.' }

  try {
    const { businessId } = await upsertBusinessProfile(
      supabase,
      user.id,
      parsed.data.input,
      parsed.data.enriched,
    )
    const { audienceId, lineageId } = await upsertPrimaryAudience(supabase, businessId, parsed.data.input, {
      markOnboardingComplete: parsed.data.markComplete,
    })
    if (parsed.data.reviews.length > 0) {
      await saveAudienceReviews(supabase, businessId, lineageId, parsed.data.reviews)
    }
    return { ok: true, businessId, audienceId, lineageId }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error'
    console.warn('[shortlist] persistOnboardingState', detail)
    return { ok: false, error: detail }
  }
}
