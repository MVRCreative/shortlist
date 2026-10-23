import type { Digest, EnrichedProfile, ProfileInput, SampleAccount } from '@/lib/gtm/schemas'

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

function sentence(text: string) {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  const first = trimmed.split(/(?<=[.!?])\s/)[0] ?? trimmed
  return first.replace(/[.!?]*$/, '')
}

const REGION_KEYWORDS: Record<string, string> = {
  'north america': 'North America',
  'united states': 'United States',
  us: 'United States',
  usa: 'United States',
  canada: 'Canada',
  uk: 'United Kingdom',
  europe: 'Europe',
  emea: 'EMEA',
  apac: 'APAC',
  australia: 'Australia',
  latam: 'LATAM',
}

const TITLE_PATTERNS = [
  /\b(head of [a-z]+)/gi,
  /\b(vp(?: of)? [a-z]+)/gi,
  /\b(director of [a-z]+)/gi,
  /\b(chief [a-z]+ officer)/gi,
  /\b(cmo|cro|cto|ceo|coo|founders?)\b/gi,
]

const INDUSTRY_KEYWORDS: Record<string, string> = {
  saas: 'B2B SaaS',
  fintech: 'Fintech',
  health: 'Healthtech',
  ecommerce: 'E-commerce',
  'e-commerce': 'E-commerce',
  agency: 'Agencies',
  manufactur: 'Manufacturing',
  logistics: 'Logistics',
  security: 'Cybersecurity',
  developer: 'Developer tools',
  education: 'Edtech',
  'real estate': 'Proptech',
  retail: 'Retail',
  marketing: 'Martech',
}

function titleCase(text: string) {
  return text.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\b(Of|And)\b/g, (w) => w.toLowerCase())
}

function unique(list: string[]) {
  return [...new Set(list)]
}

export function mockEnrich(input: ProfileInput): EnrichedProfile {
  const market = input.targetMarket.toLowerCase()
  const offering = input.offering.toLowerCase()
  const combined = `${market} ${offering}`

  const industries = unique(
    Object.entries(INDUSTRY_KEYWORDS)
      .filter(([key]) => combined.includes(key))
      .map(([, label]) => label),
  )
  const regions = unique(
    Object.entries(REGION_KEYWORDS)
      .filter(([key]) => new RegExp(`\\b${key}\\b`).test(market))
      .map(([, label]) => label),
  )
  const titles = unique(
    TITLE_PATTERNS.flatMap((pattern) =>
      [...input.targetMarket.matchAll(pattern)].map((m) => {
        const raw = m[1]
        if (/^founders?$/i.test(raw)) return 'Founder'
        if (/^(cmo|cro|cto|ceo|coo)$/i.test(raw)) return raw.toUpperCase()
        return titleCase(raw.replace(/^vp\b/i, 'VP'))
      }),
    ),
  )

  const sizeMatch = input.targetMarket.match(/(\d[\d,]*)\s*(?:–|-|to)\s*(\d[\d,]*)\s*(?:employees|people|staff)?/i)
  const companySize = sizeMatch ? `${sizeMatch[1]}–${sizeMatch[2]} employees` : '20–500 employees'

  const isService = /studio|agency|consult|service|done-for-you|design/i.test(offering)
  const core = sentence(input.offering).split(/\s[—–-]\s|;/)[0]
  const buyer = titles[0] ?? 'growth leaders'

  return {
    oneLiner: `${core}.`,
    category: isService ? 'Specialist services' : 'B2B software',
    valueProp: `${input.companyName} helps ${/^(founder|head|vp|director|chief|c[a-z]o)/i.test(buyer) ? `${buyer}s` : buyer} get to outcomes faster without adding headcount — ${input.goal ? `built for teams chasing goals like “${input.goal}”` : 'with a clear, fixed path to results'}.`,
    painsSolved: [
      'Pipeline depends on referrals and founder time',
      'Messaging is generic and doesn’t land with buyers',
      'Teams lack the bandwidth to execute consistently',
    ],
    differentiators: [
      isService ? 'Senior-only team, no handoffs' : 'Live in days, not quarters',
      input.pricing ? `Transparent pricing: ${input.pricing}` : 'Simple, predictable pricing',
      'Focused on one ICP instead of everyone',
    ],
    icp: {
      industries: industries.length ? industries.slice(0, 4) : ['B2B SaaS', 'Professional services', 'Fintech'],
      companySize,
      regions: regions.length ? regions.slice(0, 3) : ['North America'],
      buyerTitles: titles.length ? titles.slice(0, 4) : ['Founder', 'Head of Marketing', 'VP Sales'],
    },
    buyingSignals: [
      'Recently raised a funding round',
      'Hiring for marketing or sales roles',
      'New executive in the buyer seat',
      'Launching a new product or market',
    ],
    voice: 'Direct, confident, and specific — sounds like an operator, not a vendor.',
  }
}

const NAME_START = ['North', 'Bright', 'Hollow', 'Clear', 'Iron', 'Lumen', 'Cedar', 'Harbor', 'Atlas', 'Kite', 'Copper', 'Signal', 'Field', 'Ember', 'Orbit', 'Tidal', 'Quill', 'Vantage']
const NAME_END = ['stack', 'loop', 'works', 'labs', 'path', 'grid', 'base', 'ware', 'line', 'form', 'yard', 'field', 'point', 'well']
const CITIES = ['Austin, US', 'Toronto, CA', 'Denver, US', 'New York, US', 'Chicago, US', 'Seattle, US', 'Boston, US', 'London, UK', 'Vancouver, CA', 'San Francisco, US']
const SIGNALS = ['Raised Series B last month', 'Hiring a Head of Marketing', 'New CMO started 30 days ago', 'Launched a new product line', 'Hiring 3 SDRs', 'Rebranded domain this quarter', 'Opened a second office', 'Raised Series A in Q3', 'Website traffic up 40% YoY', 'Posted a RevOps role']
const SIZES = ['51–200', '51–200', '201–500', '101–250']

function companyName(rand: () => number) {
  const start = pick(rand, NAME_START)
  const end = pick(rand, NAME_END)
  return `${start}${end}`
}

export function mockAccounts(input: ProfileInput, enriched: EnrichedProfile): SampleAccount[] {
  const rand = seededRandom(`${input.companyName}-accounts`)
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
        ? `Partial match — ${industry.toLowerCase()} buyers rarely fit ${input.companyName}’s motion.`
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
  const rand = seededRandom(`${input.companyName}-digest-${week}`)
  const industries = unique(fits.map((f) => f.industry)).concat(enriched.icp.industries)
  const pain = pick(rand, enriched.painsSolved)
  const differentiator = pick(rand, enriched.differentiators)
  const title = enriched.icp.buyerTitles[0] ?? 'Head of Marketing'

  const leads = Array.from({ length: leadsPerDigest }, () => {
    const company = companyName(rand)
    const industry = pick(rand, industries)
    return {
      contactName: `${pick(rand, FIRST)} ${pick(rand, LAST)}`,
      title: pick(rand, enriched.icp.buyerTitles),
      company,
      domain: `${company.toLowerCase()}.com`,
      signal: pick(rand, SIGNALS),
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
      body: `It’s rarely a talent issue. It’s a focus issue.\n\nAt ${input.companyName}, we see the same pattern every week — teams trying to reach everyone, and landing with no one.\n\nWhat works instead:\n→ Pick 10 accounts that actually fit\n→ Find the trigger that makes now the right time\n→ Say one specific thing that proves you understand them\n\n${differentiator}. That’s the whole playbook.\n\nCurious how others are approaching this — what’s working for you right now?`,
    },
    linkedinMessages: [
      {
        label: 'Connection request',
        message: `Hi {{first_name}} — noticed {{company}} is ${pick(rand, ['hiring on the marketing side', 'growing fast', 'launching something new'])}. I work with ${enriched.icp.industries[0]} teams on ${pain.toLowerCase()}. Would love to connect.`,
      },
      {
        label: 'Follow-up',
        message: `Thanks for connecting, {{first_name}}.\n\nQuick context: ${enriched.oneLiner}\n\nTeams like yours usually come to us when ${pain.toLowerCase()}. ${differentiator}.\n\nWorth a 20-minute call to compare notes? Happy to share what we’re seeing across similar companies either way.`,
      },
    ],
    xPost: `${pain}? Stop adding volume. Pick 10 accounts that fit, find the trigger, say one specific thing. That’s ${input.companyName}’s whole approach.`,
    blogIdea: {
      title: `Why ${enriched.icp.industries[0]} teams stall on growth (and the 10-account fix)`,
      angle: `A practical breakdown of how ${title}s can replace broad campaigns with a focused weekly account list — drawn from ${input.companyName}’s client work.`,
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
