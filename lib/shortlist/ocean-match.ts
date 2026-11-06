import { OceanApiError, OceanClient } from '@/lib/ocean/client'
import { COMPANY_SEARCH_FIELDS, mapFundingSignal } from '@/lib/ocean/map-company'
import { unwrapOceanCompany, type OceanCompany } from '@/lib/ocean/schemas'
import type { ProfileInput, SampleAccount } from '@/lib/shortlist/schemas'
import { normalizeDomain } from '@/lib/shortlist/url'

const MATCH_SIZE = 10

const SIZE_BUCKETS = [
  ['0-1', 0, 1],
  ['2-10', 2, 10],
  ['11-50', 11, 50],
  ['51-200', 51, 200],
  ['201-500', 201, 500],
  ['501-1000', 501, 1000],
  ['1001-5000', 1001, 5000],
  ['5001-10000', 5001, 10000],
  ['10001-50000', 10001, 50000],
  ['50001-100000', 50001, 100000],
  ['100001-500000', 100001, 500000],
  ['500000+', 500000, Number.POSITIVE_INFINITY],
] as const

const REGION_COUNTRIES: Record<string, readonly string[]> = {
  'united states': ['us'],
  usa: ['us'],
  us: ['us'],
  'u.s.': ['us'],
  'u.s.a.': ['us'],
  america: ['us'],
  canada: ['ca'],
  'north america': ['us', 'ca'],
  'united kingdom': ['gb'],
  uk: ['gb'],
  britain: ['gb'],
  england: ['gb'],
  scotland: ['gb'],
  wales: ['gb'],
  ireland: ['ie'],
  'uk and ireland': ['gb', 'ie'],
  germany: ['de'],
  france: ['fr'],
  netherlands: ['nl'],
  spain: ['es'],
  italy: ['it'],
  sweden: ['se'],
  norway: ['no'],
  denmark: ['dk'],
  australia: ['au'],
  'new zealand': ['nz'],
  europe: ['gb', 'ie', 'de', 'fr', 'nl', 'es', 'it', 'se', 'no', 'dk', 'fi', 'be', 'at', 'ch', 'pt', 'pl'],
  'european union': ['de', 'fr', 'nl', 'es', 'it', 'se', 'dk', 'fi', 'be', 'at', 'pt', 'pl', 'ie'],
  eu: ['de', 'fr', 'nl', 'es', 'it', 'se', 'dk', 'fi', 'be', 'at', 'pt', 'pl', 'ie'],
  apac: ['au', 'nz', 'sg', 'jp', 'in', 'kr'],
  'asia pacific': ['au', 'nz', 'sg', 'jp', 'in', 'kr'],
  'latin america': ['mx', 'br', 'ar', 'cl', 'co'],
  latam: ['mx', 'br', 'ar', 'cl', 'co'],
}

export type CompanySearchBody = {
  size: number
  fields: string[]
  companiesFilters: Record<string, unknown>
}

function regionKey(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Map a freeform size label onto Ocean's employee buckets. Unparsed labels are skipped. */
export function oceanCompanySizes(labels: string[]): string[] {
  const ids = new Set<string>()
  for (const label of labels) {
    const text = label.toLowerCase().replace(/[–—]/g, '-').replace(/,/g, '')
    const nums = [...text.matchAll(/\d+/g)].map((match) => Number(match[0]))
    if (nums.length === 0) continue
    const under = /\b(under|below|fewer|less than)\b/.test(text) || /<\s*\d/.test(text)
    const over = /\b(over|above|more than|or more|plus)\b/.test(text) || /\d\s*\+/.test(text)
    const first = nums[0] ?? 0
    const last = nums[nums.length - 1] ?? first
    const min = nums.length === 1 ? (under ? 0 : first) : Math.min(first, last)
    const max =
      nums.length === 1 ? (over ? Number.POSITIVE_INFINITY : under ? first : first) : Math.max(first, last)
    for (const [id, bucketMin, bucketMax] of SIZE_BUCKETS) {
      if (max >= bucketMin && min <= bucketMax) ids.add(id)
    }
  }
  return [...ids]
}

/** Map freeform region labels to lowercase ISO country codes Ocean accepts. */
export function oceanCountries(labels: string[]): string[] {
  const codes = new Set<string>()
  for (const label of labels) {
    const key = regionKey(label)
    const direct = REGION_COUNTRIES[key]
    const parts = direct
      ? direct
      : key
          .split(/\s*(?:,|\/|;|\band\b)\s*/)
          .flatMap((part) => REGION_COUNTRIES[part.trim()] ?? [])
    for (const code of parts) codes.add(code)
    if (codes.size >= 25) break
  }
  return [...codes].slice(0, 25)
}

function domainsFrom(values: string[]) {
  const seen = new Set<string>()
  const domains: string[] = []
  for (const value of values) {
    const domain = normalizeDomain(value)
    if (!domain || seen.has(domain)) continue
    seen.add(domain)
    domains.push(domain)
  }
  return domains
}

export function buildCompanySearch(
  input: ProfileInput,
  options?: { size?: number; extraExcludeDomains?: readonly string[] },
): { body: CompanySearchBody; seeds: string[]; blocked: string[] } | { error: string } {
  const seeds = domainsFrom(input.seedClients)
  if (seeds.length === 0) {
    return { error: 'Add example client websites so Ocean can find similar accounts.' }
  }

  const blocked = new Set(seeds)
  const own = normalizeDomain(input.website)
  if (own) blocked.add(own)
  for (const domain of domainsFrom(input.excludedDomains)) blocked.add(domain)
  for (const domain of domainsFrom([...(options?.extraExcludeDomains ?? [])])) blocked.add(domain)
  const blockedList = [...blocked]

  const companiesFilters: Record<string, unknown> = {
    lookalikeDomains: seeds,
    excludeDomains: blockedList.slice(0, 50),
    companyMatchingMode: 'precise',
  }
  const companySizes = oceanCompanySizes(input.companySizes)
  if (companySizes.length > 0) companiesFilters.companySizes = companySizes
  const countries = oceanCountries(input.regions)
  if (countries.length > 0) companiesFilters.primaryLocations = { includeCountries: countries }

  return {
    seeds,
    blocked: blockedList,
    body: {
      size: options?.size ?? MATCH_SIZE,
      fields: [...COMPANY_SEARCH_FIELDS],
      companiesFilters,
    },
  }
}

function countryName(code: string | undefined) {
  if (!code || !/^[a-z]{2}$/i.test(code)) return null
  const upper = code.toUpperCase()
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(upper) ?? upper
  } catch {
    return upper
  }
}

function primaryLocation(company: OceanCompany) {
  const locations = company.locations ?? []
  return locations.find((location) => location.primary) ?? locations[0] ?? null
}

function employeeLabel(company: OceanCompany) {
  if (company.companySize) return company.companySize.replace('-', '–')
  if (typeof company.employeeCountOcean === 'number') return `${company.employeeCountOcean} employees`
  return 'Size not listed'
}

function cityName(value: string | undefined) {
  const city = value?.trim()
  if (!city) return null
  if (/earth/i.test(city)) return null
  if (/[^\p{L}\p{N}\s.'-]/u.test(city)) return null
  return city
}

function locationLabel(company: OceanCompany) {
  const location = primaryLocation(company)
  const city = cityName(location?.locality)
  const country = countryName(location?.country ?? company.primaryCountry)
  const label = [city, country].filter(Boolean).join(', ')
  return label || 'Location not listed'
}

function industryLabel(company: OceanCompany) {
  const industries = (company.industries ?? []).map((item) => item.trim()).filter(Boolean)
  return industries.slice(0, 2).join(', ') || 'Industry not listed'
}

function realSignal(company: OceanCompany) {
  const funding = mapFundingSignal(company)
  if (funding) return funding.title
  for (const item of company.buyingSignals ?? []) {
    if (!item || typeof item !== 'object') continue
    const record = item as { key?: unknown; label?: unknown }
    const key = typeof record.key === 'string' ? record.key : ''
    const label = typeof record.label === 'string' ? record.label.trim() : ''
    if (!label) continue
    if (key.startsWith('hiring_') || key.startsWith('recruiting_velocity')) return label
  }
  return ''
}

function oceanDescription(company: OceanCompany) {
  const text = company.description?.replace(/\s+/g, ' ').trim()
  if (!text) return ''
  if (text.length <= 220) return text
  const cut = text.slice(0, 220)
  const lastSpace = cut.lastIndexOf(' ')
  const trimmed = (lastSpace > 140 ? cut.slice(0, lastSpace) : cut).trimEnd()
  return `${trimmed}…`
}

function companyLinkedInUrl(company: OceanCompany): string | null {
  const raw = company.medias?.linkedin?.url?.trim()
  if (!raw) return null
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    const host = url.hostname.toLowerCase()
    if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) return null
    if (!url.pathname.startsWith('/company/')) return null
    return url.toString()
  } catch {
    return null
  }
}

export function toSampleAccounts(
  companies: OceanCompany[],
  blocked: Set<string>,
  limit = MATCH_SIZE,
): SampleAccount[] {
  const seen = new Set<string>()
  const accounts: SampleAccount[] = []
  for (const company of companies) {
    const domain = company.domain.trim().toLowerCase().replace(/^www\./, '')
    if (!domain || blocked.has(domain) || seen.has(domain)) continue
    seen.add(domain)
    accounts.push({
      id: `ocean:${domain}`,
      name: company.name?.trim() || domain,
      domain,
      industry: industryLabel(company),
      employees: employeeLabel(company),
      location: locationLabel(company),
      signal: realSignal(company),
      fitReason: oceanDescription(company),
      linkedinCompanyUrl: companyLinkedInUrl(company),
    })
    if (accounts.length >= limit) break
  }
  return accounts
}

function oceanErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes('OCEAN_API_TOKEN')) {
    return 'Add OCEAN_API_TOKEN to the server environment, then try again.'
  }
  if (error instanceof OceanApiError) {
    if (error.status === 402) return 'Ocean is out of credits for this search.'
    if (error.status === 401 || error.status === 403) return 'Ocean rejected the API token. Check OCEAN_API_TOKEN.'
    console.warn('[shortlist] ocean match', error.status, error.message)
    return `Ocean couldn't search companies (${error.status}): ${error.message}`
  }
  const detail = error instanceof Error ? error.message : 'Unknown error'
  console.warn('[shortlist] ocean match', detail)
  return `Couldn't find accounts: ${detail}`
}

/** One company search for onboarding calibration. No contacts, no mock fill. */
export async function matchAccountsFromOcean(
  input: ProfileInput,
): Promise<{ ok: true; accounts: SampleAccount[] } | { ok: false; error: string }> {
  const built = buildCompanySearch(input)
  if ('error' in built) return { ok: false, error: built.error }

  const token = process.env.OCEAN_API_TOKEN?.trim()
  if (!token) return { ok: false, error: 'Add OCEAN_API_TOKEN to the server environment, then try again.' }

  try {
    const response = await new OceanClient(token).searchCompanies(built.body)
    const companies = response.companies.map((row) => unwrapOceanCompany(row))
    const accounts = toSampleAccounts(companies, new Set(built.blocked))
    if (accounts.length === 0) {
      const missing = Object.keys(response.missingDomains ?? {})
      if (missing.length > 0) {
        return {
          ok: false,
          error: `Ocean doesn't have enough data on ${missing.slice(0, 3).join(', ')} to find similar accounts.`,
        }
      }
      return {
        ok: false,
        error: 'Ocean returned no accounts for this size and region. Broaden those filters and try again.',
      }
    }
    return { ok: true, accounts }
  } catch (error) {
    return { ok: false, error: oceanErrorMessage(error) }
  }
}

/**
 * Weekly discovery. Returns accounts the caller has not already shown.
 * Does not look up people. Callers enrich only the accounts they keep.
 */
export async function findNewAccountsFromOcean(
  input: ProfileInput,
  options: { target: number; extraExcludeDomains?: readonly string[] },
): Promise<{ ok: true; accounts: SampleAccount[] } | { ok: false; error: string }> {
  const target = Math.min(Math.max(Math.trunc(options.target), 1), MATCH_SIZE)
  const built = buildCompanySearch(input, {
    size: target,
    extraExcludeDomains: options.extraExcludeDomains,
  })
  if ('error' in built) return { ok: false, error: built.error }

  const token = process.env.OCEAN_API_TOKEN?.trim()
  if (!token) return { ok: false, error: 'Add OCEAN_API_TOKEN to the server environment, then try again.' }

  try {
    const client = new OceanClient(token)
    const blocked = new Set(built.blocked)
    const collected: OceanCompany[] = []
    let searchAfter: string | string[] | undefined
    let missing: string[] = []

    for (let page = 0; page < 3; page += 1) {
      const body: Record<string, unknown> = { ...built.body, size: target }
      if (searchAfter) body.searchAfter = searchAfter
      const response = await client.searchCompanies(body)
      missing = Object.keys(response.missingDomains ?? {})
      collected.push(...response.companies.map((row) => unwrapOceanCompany(row)))
      const selected = toSampleAccounts(collected, blocked, target)
      searchAfter = response.searchAfter
      if (selected.length >= target || !searchAfter || response.companies.length === 0) break
    }

    const accounts = toSampleAccounts(collected, blocked, target)
    if (accounts.length === 0) {
      if (missing.length > 0) {
        return {
          ok: false,
          error: `Ocean doesn't have enough data on ${missing.slice(0, 3).join(', ')} to find similar accounts.`,
        }
      }
      return {
        ok: false,
        error: 'Ocean returned no new accounts after excluding accounts you have already seen.',
      }
    }
    return { ok: true, accounts }
  } catch (error) {
    return { ok: false, error: oceanErrorMessage(error) }
  }
}
