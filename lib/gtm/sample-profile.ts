import type { ProfileInput } from '@/lib/gtm/schemas'

export const emptyProfile: ProfileInput = {
  companyName: '',
  website: '',
  offering: '',
  targetMarket: '',
  pricing: '',
  goal: '',
}

export const sampleProfile: ProfileInput = {
  companyName: 'Northbeam Studio',
  website: 'northbeam.studio',
  offering:
    'A brand and web design studio that rebuilds marketing sites for B2B SaaS companies in 6 weeks — positioning, identity refresh, and a Next.js site the marketing team can edit themselves.',
  targetMarket:
    'Series A–C B2B SaaS companies in North America, 50–300 employees. Usually the Head of Marketing or VP Marketing, sometimes the founder.',
  pricing: 'Fixed-scope projects from $40k–$90k',
  goal: '4 qualified intro calls per month',
}
