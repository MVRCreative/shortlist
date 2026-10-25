import type { StudioProfile } from '@/lib/shortlist/schemas'

export const emptyProfile: StudioProfile = {
  website: '',
  services: [],
  caseStudies: [],
  seedClients: [],
  industries: [],
  companySizes: [],
  regions: [],
  buyerTitles: [],
  signals: [],
  excludedDomains: [],
}

export const sampleProfile: StudioProfile = {
  website: 'fieldworkstudio.com',
  companyName: 'Fieldwork Studio',
  services: ['Motion', 'Content & copy'],
  caseStudies: ['fieldworkstudio.com/work/relay-launch-film', 'fieldworkstudio.com/work/stackline-product-explainer'],
  seedClients: ['linear.app', 'vercel.com', 'raycast.com'],
  industries: ['B2B SaaS', 'Developer tools'],
  companySizes: ['51–200'],
  regions: ['North America'],
  buyerTitles: ['CMO / Head of Marketing', 'Founder / CEO'],
  signals: ['Just raised funding', 'Launching a product'],
  dealSize: '25-75k',
  excludedDomains: ['relay.so', 'stackline.dev', 'buck.co'],
}
