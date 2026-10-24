import type { ProfileInput } from '@/lib/gtm/schemas'

export const emptyProfile: ProfileInput = {
  companyName: '',
  website: '',
  offering: '',
  industries: [],
  companySizes: [],
  regions: [],
  targetMarket: '',
  pricing: '',
  goal: '',
}

export const sampleProfile: ProfileInput = {
  companyName: 'Northbeam Studio',
  website: 'northbeam.studio',
  offering:
    'A brand and web design studio that rebuilds marketing sites for B2B SaaS companies in 6 weeks — positioning, identity refresh, and a Next.js site the marketing team can edit themselves.',
  industries: ['B2B SaaS', 'Fintech', 'Developer tools'],
  companySizes: ['51–200', '201–500'],
  regions: ['North America'],
  targetMarket: 'Series A–C. Usually the Head of Marketing or VP Marketing, sometimes the founder.',
  pricing: 'Fixed-scope projects from $40k–$90k',
  goal: '4 qualified intro calls per month',
}
