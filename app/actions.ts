'use server'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { mockDigest } from '@/lib/shortlist/mock'
import { matchAccountsFromOcean } from '@/lib/shortlist/ocean-match'
import { aiErrorMessage, profileModel } from '@/lib/shortlist/openai'
import { dealSizeLabel } from '@/lib/shortlist/profile-options'
import { readWebsiteProfile, type WebsiteRead } from '@/lib/shortlist/read-website'
import { studioName } from '@/lib/shortlist/url'
import {
  contentChannels,
  digestSchema,
  enrichedProfileSchema,
  profileInputSchema,
  sampleAccountSchema,
  type Digest,
  type EnrichedProfile,
  type ProfileInput,
  type SampleAccount,
} from '@/lib/shortlist/schemas'

const MODEL = 'google/gemini-3.5-flash'

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

function logFallback(step: string, error: unknown) {
  console.warn(`[shortlist] ${step}: AI unavailable, using demo output —`, error instanceof Error ? error.message : error)
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
  leadsPerDigest: z.number().int().min(1).max(25),
  channels: z.array(z.enum(contentChannels)),
  week: z.number().int().min(0),
})

export async function generateDigest(raw: z.infer<typeof digestRequestSchema>): Promise<Result<Digest>> {
  const parsed = digestRequestSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid digest settings.' }
  const args = parsed.data

  const summarize = (list: SampleAccount[]) =>
    list.map((a) => `- ${a.name}: ${a.industry}, ${a.employees}, ${a.location}`).join('\n') || '- none'

  try {
    const { output } = await generateText({
      model: MODEL,
      output: Output.object({ schema: digestSchema }),
      system: [
        'You write a weekly pipeline digest for a founder or sales leader.',
        'Accounts must be fictional people at fictional companies that resemble the accounts marked as a good fit and avoid traits of rejected accounts.',
        'Content must sound like the brand voice, be specific to the offering, and avoid emojis, hashtag spam, and clichés.',
        'Every account gets its own personalized LinkedIn message that names their company and signal; never reuse the same opener twice.',
        'Always include a plausible linkedinUrl and company domain. Set email to a verified work address, or null when verification would fail — never invent an unverified email string.',
      ].join(' '),
      prompt: [
        describeProfile(args.input, args.enriched),
        `Accounts marked as GOOD fit:\n${summarize(args.fits)}`,
        `Accounts marked as NOT a fit:\n${summarize(args.misses)}`,
        `This is digest #${args.week + 1}; vary the theme from previous weeks.`,
        `Generate exactly ${args.leadsPerDigest} leads.`,
      ].join('\n\n'),
    })
    return { ok: true, data: { ...output, leads: output.leads.slice(0, args.leadsPerDigest) }, source: 'ai' }
  } catch (error) {
    logFallback('generateDigest', error)
    return { ok: true, data: mockDigest(args), source: 'demo' }
  }
}
