import { z } from 'zod'

export const profileInputSchema = z.object({
  companyName: z.string().trim().min(1, 'Add your company name').max(120),
  website: z.string().trim().max(200),
  offering: z.string().trim().min(10, 'Tell us a bit more about what you sell').max(1200),
  industries: z
    .array(z.string().trim().min(1).max(60))
    .min(1, 'Pick at least one industry')
    .max(8, 'Pick up to 8 industries'),
  companySizes: z.array(z.string().max(20)).max(6),
  regions: z.array(z.string().max(40)).max(6),
  targetMarket: z.string().trim().max(800),
  pricing: z.string().trim().max(300),
  goal: z.string().trim().max(300),
})
export type ProfileInput = z.infer<typeof profileInputSchema>

export const enrichedProfileSchema = z.object({
  oneLiner: z.string().describe('One sentence describing what the company does, under 20 words'),
  category: z.string().describe('Short market category, e.g. "Revenue intelligence software"'),
  valueProp: z.string().describe('The core value proposition in 1-2 sentences'),
  painsSolved: z.array(z.string()).describe('3 specific customer pains the offering solves'),
  differentiators: z.array(z.string()).describe('3 short differentiators vs alternatives'),
  icp: z.object({
    industries: z.array(z.string()).describe('3-5 target industries'),
    companySize: z.string().describe('Employee range, e.g. "50–500 employees"'),
    regions: z.array(z.string()).describe('1-3 target regions'),
    buyerTitles: z.array(z.string()).describe('3-4 buyer job titles'),
  }),
  buyingSignals: z.array(z.string()).describe('3-4 observable signals that an account is in-market'),
  voice: z.string().describe('How the brand should sound in outbound and social, 1 sentence'),
})
export type EnrichedProfile = z.infer<typeof enrichedProfileSchema>

export const sampleAccountSchema = z.object({
  name: z.string(),
  domain: z.string().describe('Plausible website domain, e.g. acme.com'),
  industry: z.string(),
  employees: z.string().describe('Employee range, e.g. "51–200"'),
  location: z.string().describe('City, Country'),
  signal: z.string().describe('A short, recent buying signal, under 10 words'),
  fitReason: z.string().describe('Why this account may fit, under 20 words'),
})
export const sampleAccountsSchema = z.object({
  accounts: z.array(sampleAccountSchema).describe('Exactly 10 accounts'),
})
export type SampleAccount = z.infer<typeof sampleAccountSchema> & { id: string }

export type Verdict = 'fit' | 'nofit'

export const contentChannels = ['linkedinPost', 'linkedinMessage', 'xPost', 'blogIdea'] as const
export type ContentChannel = (typeof contentChannels)[number]

export const channelLabels: Record<ContentChannel, string> = {
  linkedinPost: 'LinkedIn post',
  linkedinMessage: 'LinkedIn messages',
  xPost: 'X post',
  blogIdea: 'Blog idea',
}

export type DigestSettings = {
  cadence: 'weekly' | 'monthly'
  leadsPerDigest: number
  channels: ContentChannel[]
  email: string
}

export const digestSchema = z.object({
  theme: z.string().describe('This digest’s narrative theme, under 8 words'),
  leads: z.array(
    z.object({
      contactName: z.string(),
      title: z.string(),
      company: z.string(),
      domain: z.string(),
      signal: z.string().describe('Recent buying signal, under 10 words'),
      angle: z.string().describe('Suggested outreach angle, under 20 words'),
      message: z
        .string()
        .describe(
          'Ready-to-send LinkedIn message to this person, 50-90 words, addressed by first name, references their signal and company, ends with a low-pressure ask',
        ),
    }),
  ),
  linkedinPost: z.object({
    hook: z.string().describe('First line that stops the scroll'),
    body: z.string().describe('Rest of the post, 80-140 words, line breaks allowed'),
  }),
  xPost: z.string().describe('Under 270 characters'),
  blogIdea: z.object({
    title: z.string(),
    angle: z.string().describe('1-2 sentences on the angle'),
    outline: z.array(z.string()).describe('4-5 section headings'),
  }),
})
export type Digest = z.infer<typeof digestSchema>
