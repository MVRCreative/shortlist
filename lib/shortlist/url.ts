import type { StudioProfile } from '@/lib/shortlist/schemas'

const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/

function stripScheme(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/^www\./, '')
}

/** "https://www.Acme.com/about?x=1" → "acme.com". Returns null when it doesn't look like a website. */
export function normalizeDomain(raw: string) {
  const host = stripScheme(raw).split(/[/?#]/)[0].replace(/:\d+$/, '').replace(/\.$/, '')
  return DOMAIN_PATTERN.test(host) ? host : null
}

/** Keeps the path: "https://www.acme.com/work/launch/" → "acme.com/work/launch". */
export function normalizeUrl(raw: string) {
  const host = normalizeDomain(raw)
  if (!host) return null
  const rest = stripScheme(raw)
    .slice(stripScheme(raw).indexOf(host) + host.length)
    .replace(/^:\d+/, '')
    .split(/[?#]/)[0]
    .replace(/\/+$/, '')
  return `${host}${rest}`
}

export function faviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
}

const PLACEHOLDER_NAMES = new Set([
  'website',
  'yourwebsite',
  'mywebsite',
  'site',
  'yoursite',
  'mysite',
  'domain',
  'example',
  'company',
  'yourcompany',
  'studio',
  'test',
  'url',
])

const NAME_SUFFIXES = [
  'studios',
  'studio',
  'creative',
  'collective',
  'design',
  'digital',
  'agency',
  'motion',
  'media',
  'works',
  'house',
  'labs',
  'lab',
  'co',
]

function splitCompound(word: string) {
  const suffix = NAME_SUFFIXES.find((s) => word.endsWith(s) && word.length - s.length >= 3)
  return suffix ? [word.slice(0, -suffix.length), suffix] : [word]
}

/** "acmestudio.com" → "Acme Studio", "north-beam.co" → "North Beam". Empty for placeholder domains. */
export function nameFromDomain(domain: string) {
  const root = normalizeDomain(domain)?.split('.')[0] ?? ''
  if (PLACEHOLDER_NAMES.has(root.replace(/-/g, ''))) return ''
  return root
    .split('-')
    .filter(Boolean)
    .flatMap(splitCompound)
    .map((part) => (part === 'co' ? 'Co' : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ')
}

export function studioName(profile: Pick<StudioProfile, 'companyName' | 'website'>) {
  const given = profile.companyName?.trim() ?? ''
  const usable = given && !PLACEHOLDER_NAMES.has(given.toLowerCase().replace(/[\s-]/g, '')) ? given : ''
  return usable || nameFromDomain(profile.website) || 'Your studio'
}
