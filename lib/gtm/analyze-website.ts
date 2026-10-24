import { SERVICE_OPTIONS } from '@/lib/gtm/profile-options'
import { nameFromDomain, normalizeDomain } from '@/lib/gtm/url'

export type WebsiteAnalysis = {
  companyName: string
  services: string[]
  caseStudies: string[]
}

const CASE_STUDY_SLUGS = ['brand-refresh', 'product-launch', 'site-rebuild', 'explainer-film', 'design-system']

function hash(text: string) {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0
  return value
}

/**
 * Reads a studio's website and returns what we could infer.
 * Mocked for now: swap the body for a fetch to the real analysis API.
 */
export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis | null> {
  const domain = normalizeDomain(url)
  if (!domain) return null

  await new Promise((resolve) => setTimeout(resolve, 1500))

  const seed = hash(domain)
  const services = SERVICE_OPTIONS.filter((_, index) => (seed >> index) % 3 === 0).slice(0, 3)
  const caseStudies = [0, 1].map((offset) => {
    const slug = CASE_STUDY_SLUGS[(seed + offset * 2) % CASE_STUDY_SLUGS.length]
    return `${domain}/work/${slug}`
  })

  return {
    companyName: nameFromDomain(domain),
    services: services.length > 0 ? [...services] : ['Branding', 'Web design'],
    caseStudies,
  }
}
