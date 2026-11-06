import type { SupabaseClient } from '@supabase/supabase-js'
import type { EnrichedProfile, ProfileInput } from '@/lib/shortlist/schemas'
import { normalizeDomain } from '@/lib/shortlist/url'
import type { Database, Json } from '@/lib/supabase/database.types'

type Client = SupabaseClient<Database>

const DEAL_SIZE_MAP: Record<string, Database['public']['Enums']['deal_size']> = {
  '<10k': 'under_10k',
  '10-25k': '10k_25k',
  '25-75k': '25k_75k',
  '75k+': '75k_plus',
}

const REGION_MAP: Record<string, Database['public']['Enums']['region_code']> = {
  'north america': 'north_america',
  'united states': 'north_america',
  usa: 'north_america',
  us: 'north_america',
  canada: 'north_america',
  'uk and ireland': 'uk_ireland',
  'uk & ireland': 'uk_ireland',
  'united kingdom': 'uk_ireland',
  uk: 'uk_ireland',
  europe: 'europe',
  eu: 'europe',
  apac: 'apac',
  'asia pacific': 'apac',
  'latin america': 'latin_america',
  latam: 'latin_america',
}

const SIZE_MAP: Record<string, Database['public']['Enums']['employee_range']> = {
  '1-10': '1-10',
  '1–10': '1-10',
  '11-50': '11-50',
  '11–50': '11-50',
  '51-200': '51-200',
  '51–200': '51-200',
  '201-500': '201-500',
  '201–500': '201-500',
  '501-1000': '501-1000',
  '501–1000': '501-1000',
  '1000+': '1000+',
  '1,000+': '1000+',
}

function mapRegions(labels: string[]): Database['public']['Enums']['region_code'][] {
  const out = new Set<Database['public']['Enums']['region_code']>()
  for (const label of labels) {
    const key = label.toLowerCase().replace(/&/g, 'and').trim()
    const mapped = REGION_MAP[key]
    if (mapped) out.add(mapped)
  }
  return [...out]
}

function mapSizes(labels: string[]): Database['public']['Enums']['employee_range'][] {
  const out = new Set<Database['public']['Enums']['employee_range']>()
  for (const label of labels) {
    const key = label.trim()
    const direct = SIZE_MAP[key]
    if (direct) {
      out.add(direct)
      continue
    }
    const nums = [...key.replace(/,/g, '').matchAll(/\d+/g)].map((m) => Number(m[0]))
    if (nums.length === 0) continue
    const first = nums[0] ?? 0
    if (first <= 10) out.add('1-10')
    else if (first <= 50) out.add('11-50')
    else if (first <= 200) out.add('51-200')
    else if (first <= 500) out.add('201-500')
    else if (first <= 1000) out.add('501-1000')
    else out.add('1000+')
  }
  return [...out]
}

export async function upsertBusinessProfile(
  client: Client,
  ownerId: string,
  input: ProfileInput,
  enriched: EnrichedProfile | null,
): Promise<{ businessId: string }> {
  const domain = normalizeDomain(input.website)
  if (!domain) throw new Error('Enter a valid website.')

  const payload = {
    owner_id: ownerId,
    website_domain: domain,
    name: input.companyName?.trim() || domain,
    description: enriched?.oneLiner ?? null,
    services: input.services,
    case_study_urls: input.caseStudies.slice(0, 3),
    deal_size: input.dealSize ? DEAL_SIZE_MAP[input.dealSize] ?? null : null,
    linkedin_url: input.linkedinUrl?.trim() || null,
    x_url: input.xUrl?.trim() || null,
    enriched_profile: (enriched ?? null) as Json | null,
    enriched_at: enriched ? new Date().toISOString() : null,
  }

  const { data: existing, error: selectError } = await client
    .from('businesses')
    .select('id')
    .eq('owner_id', ownerId)
    .maybeSingle()
  if (selectError) throw new Error(selectError.message)

  if (existing) {
    const { error } = await client.from('businesses').update(payload).eq('id', existing.id)
    if (error) throw new Error(error.message)
    return { businessId: existing.id }
  }

  const { data, error } = await client.from('businesses').insert(payload).select('id').single()
  if (error || !data) throw new Error(error?.message ?? 'business insert failed')
  return { businessId: data.id }
}

export async function upsertPrimaryAudience(
  client: Client,
  businessId: string,
  input: ProfileInput,
  options?: { name?: string; description?: string; markOnboardingComplete?: boolean },
): Promise<{ audienceId: string; lineageId: string }> {
  const { data: existing, error: existingError } = await client
    .from('audiences')
    .select('id, lineage_id, version')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .eq('is_primary', true)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message)

  const lineageId = existing?.lineage_id ?? crypto.randomUUID()
  const nextVersion = (existing?.version ?? 0) + 1

  if (existing) {
    const { error: deactivateError } = await client
      .from('audiences')
      .update({ is_active: false, is_primary: false })
      .eq('id', existing.id)
    if (deactivateError) throw new Error(deactivateError.message)
  }

  const { data: audience, error: audienceError } = await client
    .from('audiences')
    .insert({
      business_id: businessId,
      lineage_id: lineageId,
      version: nextVersion,
      is_active: true,
      is_primary: true,
      name: options?.name ?? 'Primary audience',
      description: options?.description ?? null,
      industry_slugs: [],
      custom_industries: input.industries,
      employee_ranges: mapSizes(input.companySizes),
      regions: mapRegions(input.regions),
      buyer_titles: input.buyerTitles,
      signal_types: [],
    })
    .select('id, lineage_id')
    .single()
  if (audienceError || !audience) throw new Error(audienceError?.message ?? 'audience insert failed')

  const seeds = input.seedClients
    .map((value) => normalizeDomain(value))
    .filter((value): value is string => !!value)
    .slice(0, 3)
  for (const seed of seeds) {
    const { error } = await client.from('audience_seeds').insert({
      audience_id: audience.id,
      domain: seed,
    })
    if (error && !error.message.includes('duplicate')) {
      throw new Error(error.message)
    }
  }

  const references = (input.referenceClients ?? [])
    .map((value) => normalizeDomain(value))
    .filter((value): value is string => !!value && !seeds.includes(value))
  for (const domain of references) {
    const { error } = await client.from('audience_references').insert({
      audience_id: audience.id,
      domain,
    })
    if (error && !error.message.includes('duplicate')) {
      throw new Error(error.message)
    }
  }

  for (const domain of input.excludedDomains
    .map((value) => normalizeDomain(value))
    .filter((value): value is string => !!value)) {
    const { error } = await client.from('business_exclusions').upsert(
      { business_id: businessId, domain },
      { onConflict: 'business_id,domain' },
    )
    if (error) throw new Error(error.message)
  }

  if (options?.markOnboardingComplete) {
    const { error } = await client
      .from('businesses')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', businessId)
    if (error) throw new Error(error.message)
  }

  return { audienceId: audience.id, lineageId: audience.lineage_id }
}

export async function saveAudienceReviews(
  client: Client,
  businessId: string,
  lineageId: string,
  reviews: { domain: string; verdict: 'fit' | 'nofit'; name?: string; snapshot?: Json }[],
): Promise<void> {
  for (const review of reviews) {
    const domain = normalizeDomain(review.domain)
    if (!domain) continue
    const { error } = await client.from('audience_reviews').upsert(
      {
        business_id: businessId,
        lineage_id: lineageId,
        domain,
        verdict: review.verdict === 'fit' ? 'fit' : 'not_fit',
        company_name: review.name ?? null,
        snapshot: review.snapshot ?? null,
        reviewed_at: new Date().toISOString(),
      },
      { onConflict: 'lineage_id,domain' },
    )
    if (error) throw new Error(error.message)
  }
}
