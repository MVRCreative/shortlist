'use server'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { mockAccounts, mockDigest, mockEnrich } from '@/lib/gtm/mock'
import {
  contentChannels,
  digestSchema,
  enrichedProfileSchema,
  profileInputSchema,
  sampleAccountSchema,
  sampleAccountsSchema,
  type Digest,
  type EnrichedProfile,
  type ProfileInput,
  type SampleAccount,
} from '@/lib/gtm/schemas'

const MODEL = 'google/gemini-3.5-flash'

export type DataSource = 'ai' | 'demo'
type Result<T> = { ok: true; data: T; source: DataSource } | { ok: false; error: string }

function describeProfile(input: ProfileInput, enriched?: EnrichedProfile) {
  return [
    `Company: ${input.companyName}${input.website ? ` (${input.website})` : ''}`,
    `What they sell: ${input.offering}`,
    `Target market: ${input.targetMarket}`,
    input.pricing && `Pricing: ${input.pricing}`,
    input.goal && `Goal: ${input.goal}`,
    enriched && `Enriched profile: ${JSON.stringify(enriched)}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function logFallback(step: string, error: unknown) {
  console.warn(`[mini-gtm] ${step}: AI unavailable, using demo output —`, error instanceof Error ? error.message : error)
}

export async function enrichProfile(raw: ProfileInput): Promise<Result<EnrichedProfile>> {
  const parsed = profileInputSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Some profile fields are missing.' }
  const input = parsed.data

  try {
    const { output } = await generateText({
      model: MODEL,
      output: Output.object({ schema: enrichedProfileSchema }),
      system:
        'You are a senior go-to-market strategist. Turn rough company inputs into a sharp, specific GTM profile. Be concrete, avoid buzzwords, never invent metrics.',
      prompt: describeProfile(input),
    })
    return { ok: true, data: output, source: 'ai' }
  } catch (error) {
    logFallback('enrichProfile', error)
    return { ok: true, data: mockEnrich(input), source: 'demo' }
  }
}

export async function findSampleAccounts(
  rawInput: ProfileInput,
  rawEnriched: EnrichedProfile,
): Promise<Result<SampleAccount[]>> {
  const input = profileInputSchema.safeParse(rawInput)
  const enriched = enrichedProfileSchema.safeParse(rawEnriched)
  if (!input.success || !enriched.success) return { ok: false, error: 'Profile is incomplete.' }

  try {
    const { output } = await generateText({
      model: MODEL,
      output: Output.object({ schema: sampleAccountsSchema }),
      system:
        'You simulate a Clay enrichment table for a prototype. Generate realistic but fictional companies (never real company names) that plausibly match the ICP. Make about 7 strong matches and 3 borderline ones so the user has something to reject.',
      prompt: `Generate exactly 10 sample accounts for this seller:\n${describeProfile(input.data, enriched.data)}`,
    })
    const accounts = output.accounts.slice(0, 10).map((account, index) => ({
      ...account,
      id: `acct-${index}-${account.domain}`,
    }))
    return { ok: true, data: accounts, source: 'ai' }
  } catch (error) {
    logFallback('findSampleAccounts', error)
    return { ok: true, data: mockAccounts(input.data, enriched.data), source: 'demo' }
  }
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
        'Leads must be fictional people at fictional companies that resemble the accounts marked as a good fit and avoid traits of rejected accounts.',
        'Content must sound like the brand voice, be specific to the offering, and avoid emojis, hashtag spam, and clichés.',
        'Every lead gets its own personalized LinkedIn message that names their company and signal; never reuse the same opener twice.',
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
