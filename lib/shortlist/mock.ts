import { dealSizeLabel, describeSizeRange } from '@/lib/shortlist/profile-options'
import type { Digest, EnrichedProfile, ProfileInput, SampleAccount } from '@/lib/shortlist/schemas'
import { studioName } from '@/lib/shortlist/url'

function seededRandom(seedText: string) {
  let seed = 0
  for (const char of seedText) seed = (seed * 31 + char.charCodeAt(0)) >>> 0
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

function pick<T>(rand: () => number, list: readonly T[]) {
  return list[Math.floor(rand() * list.length)]
}

function unique(list: string[]) {
  return [...new Set(list)]
}

function joinList(list: string[]) {
  if (list.length <= 1) return list[0] ?? ''
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

const SIGNAL_DETAIL: Record<string, string> = {
  'Just raised funding': 'Raised a seed to Series C round in the last 90 days',
  'Hiring marketing or design': 'Hiring for marketing, brand, or design roles',
  'Launching a product': 'Preparing a product or feature launch',
  'New leadership': 'New CMO, Head of Brand, or founder-level hire',
}

const CATEGORY_BY_SERVICE: Record<string, string> = {
  Motion: 'Motion design studio',
  Branding: 'Brand studio',
  'Web design': 'Web design studio',
  'Webflow / development': 'Web development studio',
  'Product & UX': 'Product design studio',
  'Content & copy': 'Content studio',
}

export function mockEnrich(input: ProfileInput): EnrichedProfile {
  const name = studioName(input)
  const services = input.services.map((service) => service.toLowerCase())
  const industries = input.industries.length ? input.industries : ['B2B SaaS']
  const buyer = input.buyerTitles[0] ?? 'Head of Marketing'
  const deal = dealSizeLabel(input.dealSize)
  const signals = input.signals.length
    ? input.signals.map((signal) => SIGNAL_DETAIL[signal] ?? signal)
    : Object.values(SIGNAL_DETAIL).slice(0, 4)

  return {
    oneLiner: `${name} is a ${joinList(services.slice(0, 2))} studio for ${joinList(industries.slice(0, 2))} teams.`,
    category: CATEGORY_BY_SERVICE[input.services[0]] ?? 'Creative studio',
    valueProp: `${name} gives ${pluralizeTitle(buyer)} senior ${services[0] ?? 'creative'} work that looks like the brands they admire — the same caliber as ${joinList(input.seedClients.slice(0, 2))}.`,
    painsSolved: [
      'Brand and launch work lags behind the product',
      'In-house team is stretched thin before a big moment',
      'Agencies they’ve tried feel generic or slow',
    ],
    differentiators: [
      'Senior-only team, no handoffs',
      deal ? `Typical engagement: ${deal}` : 'Fixed-scope, predictable projects',
      input.caseStudies.length ? 'Proven work for similar teams' : `Focused on ${industries[0]} only`,
    ],
    icp: {
      industries: industries.slice(0, 5),
      companySize: describeSizeRange(input.companySizes) ?? '51–500 employees',
      regions: input.regions.length ? input.regions.slice(0, 3) : ['North America'],
      buyerTitles: input.buyerTitles.slice(0, 4),
    },
    buyingSignals: signals.slice(0, 4),
    voice: 'Warm, specific, and craft-first — sounds like a peer who has shipped this before.',
  }
}

const NAME_START = ['North', 'Bright', 'Hollow', 'Clear', 'Iron', 'Lumen', 'Cedar', 'Harbor', 'Atlas', 'Kite', 'Copper', 'Signal', 'Field', 'Ember', 'Orbit', 'Tidal', 'Quill', 'Vantage']
const NAME_END = ['stack', 'loop', 'works', 'labs', 'path', 'grid', 'base', 'ware', 'line', 'form', 'yard', 'field', 'point', 'well']
const CITIES = ['Austin, US', 'Toronto, CA', 'Denver, US', 'New York, US', 'Chicago, US', 'Seattle, US', 'Boston, US', 'London, UK', 'Vancouver, CA', 'San Francisco, US']
const SIGNALS = ['Raised Series B last month', 'Hiring a Head of Marketing', 'New CMO started 30 days ago', 'Launched a new product line', 'Hiring 3 SDRs', 'Rebranded domain this quarter', 'Opened a second office', 'Raised Series A in Q3', 'Website traffic up 40% YoY', 'Posted a RevOps role']
function pluralizeTitle(raw: string) {
  const title = raw.split(' / ').pop() ?? raw
  if (/^(head|chief) of /i.test(title)) return title.replace(/^(\w+)/, '$1s')
  if (/^(founder|vp|director|c[a-z]o)\b/i.test(title)) return `${title}s`
  return title
}

const SIZES = ['51–200', '51–200', '201–500', '101–250']

function companyName(rand: () => number) {
  const start = pick(rand, NAME_START)
  const end = pick(rand, NAME_END)
  return `${start}${end}`
}

export function mockAccounts(input: ProfileInput, enriched: EnrichedProfile): SampleAccount[] {
  const rand = seededRandom(`${studioName(input)}-accounts`)
  const used = new Set<string>()
  return Array.from({ length: 10 }, (_, index) => {
    let name = companyName(rand)
    while (used.has(name)) name = companyName(rand)
    used.add(name)
    const borderline = index === 3 || index === 6 || index === 9
    const industry = borderline ? pick(rand, ['Consumer apps', 'Government', 'Non-profit']) : pick(rand, enriched.icp.industries)
    return {
      id: `acct-${index}-${name.toLowerCase()}`,
      name,
      domain: `${name.toLowerCase()}.com`,
      industry,
      employees: borderline ? pick(rand, ['1–10', '1,001–5,000']) : pick(rand, SIZES),
      location: pick(rand, CITIES),
      signal: pick(rand, SIGNALS),
      fitReason: borderline
        ? `Partial match — ${industry.toLowerCase()} buyers rarely fit ${studioName(input)}’s motion.`
        : `${industry} team in the ${enriched.icp.companySize.replace(' employees', '')} range with a clear trigger.`,
    }
  })
}

const FIRST = ['Maya', 'Jordan', 'Priya', 'Sam', 'Elena', 'Marcus', 'Hana', 'Diego', 'Olivia', 'Theo', 'Nadia', 'Chris', 'Leah', 'Omar', 'Grace', 'Ravi', 'Ines', 'Ben', 'Zoe', 'Kai', 'Amara', 'Luca', 'Sofia', 'Noah', 'Tess']
const LAST = ['Chen', 'Patel', 'Okafor', 'Reyes', 'Nguyen', 'Kowalski', 'Haddad', 'Lindqvist', 'Moreau', 'Tanaka', 'Silva', 'Brooks', 'Fischer', 'Adeyemi', 'Romero', 'Shah']

export function mockDigest(args: {
  input: ProfileInput
  enriched: EnrichedProfile
  fits: SampleAccount[]
  leadsPerDigest: number
  week: number
}): Digest {
  const { input, enriched, fits, leadsPerDigest, week } = args
  const rand = seededRandom(`${studioName(input)}-digest-${week}`)
  const industries = unique(fits.map((f) => f.industry)).concat(enriched.icp.industries)
  const pain = pick(rand, enriched.painsSolved)
  const differentiator = pick(rand, enriched.differentiators)
  const title = enriched.icp.buyerTitles[0] ?? 'Head of Marketing'

  const leads = Array.from({ length: leadsPerDigest }, () => {
    const company = companyName(rand)
    const industry = pick(rand, industries)
    const firstName = pick(rand, FIRST)
    const lastName = pick(rand, LAST)
    const domain = `${company.toLowerCase()}.com`
    const signal = pick(rand, SIGNALS)
    const leadPain = pick(rand, enriched.painsSolved).toLowerCase()
    const slug = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z-]/g, '')
    // ~1 in 4 emails fail verification at delivery — omit rather than show unverified.
    const emailVerified = rand() > 0.25
    return {
      contactName: `${firstName} ${lastName}`,
      title: pick(rand, enriched.icp.buyerTitles),
      company,
      domain,
      email: emailVerified ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}` : null,
      linkedinUrl: `https://www.linkedin.com/in/${slug}`,
      signal,
      message: pick(rand, [
        `Hi ${firstName} — saw that ${company} ${signal.charAt(0).toLowerCase()}${signal.slice(1)}. Congrats. That stage is usually when “${leadPain}” starts to bite. We help ${industry} teams fix exactly that at ${studioName(input)}. Open to a quick swap of notes on what’s working for peers right now?`,
        `${firstName}, quick one. ${signal} at ${company} caught my eye — most teams we work with hit “${leadPain}” right after a move like that. ${differentiator}. Worth 15 minutes to see if any of it applies to you?`,
        `Hi ${firstName}, I work with a handful of ${industry} teams on ${leadPain}. Noticed ${company} ${signal.charAt(0).toLowerCase()}${signal.slice(1)}, so figured it might be timely. No pitch — happy to share what we’re seeing if useful.`,
      ]),
      angle: pick(rand, [
        `Open with the trigger, then tie it to “${pick(rand, enriched.painsSolved).toLowerCase()}”.`,
        `Reference a peer ${industry} team and how they fixed “${pick(rand, enriched.painsSolved).toLowerCase()}”.`,
        `Lead with “${pick(rand, enriched.differentiators)}” — it speaks to their stage.`,
        `Short note: congratulate, then ask how they’re handling ${pick(rand, enriched.painsSolved).toLowerCase()}.`,
      ]),
    }
  })

  const themes = ['Pipeline without the guesswork', 'Fewer accounts, better conversations', 'Earn the meeting first', 'Signals beat spray-and-pray']

  return {
    theme: themes[week % themes.length],
    leads,
    linkedinPost: {
      hook: `Every ${title} I talk to says some version of the same thing: “${pain}.”`,
      body: `It’s rarely a talent issue. It’s a focus issue.\n\nAt ${studioName(input)}, we see the same pattern every week — teams trying to reach everyone, and landing with no one.\n\nWhat works instead:\n→ Pick 10 accounts that actually fit\n→ Find the trigger that makes now the right time\n→ Say one specific thing that proves you understand them\n\n${differentiator}. That’s the whole playbook.\n\nCurious how others are approaching this — what’s working for you right now?`,
    },
    xPost: `${pain}? Stop adding volume. Pick 10 accounts that fit, find the trigger, say one specific thing. That’s ${studioName(input)}’s whole approach.`,
    blogIdea: {
      title: `Why ${enriched.icp.industries[0]} teams stall on growth (and the 10-account fix)`,
      angle: `A practical breakdown of how ${pluralizeTitle(title)} can replace broad campaigns with a focused weekly account list — drawn from ${studioName(input)}’s client work.`,
      outline: [
        `The real cost of “${pain.toLowerCase()}”`,
        'Why fewer, better-fit accounts outperform volume',
        'Reading buying signals before you reach out',
        'A weekly cadence your team can actually keep',
        'What to measure in the first 90 days',
      ],
    },
  }
}
