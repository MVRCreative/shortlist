import type { StudioProfile } from '@/lib/gtm/schemas'

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
  website: 'loopframe.studio',
  companyName: 'Loopframe',
  services: ['Motion', 'Content & copy'],
  caseStudies: ['loopframe.studio/work/relay-launch-film', 'loopframe.studio/work/stackline-product-explainer'],
  seedClients: ['linear.app', 'vercel.com', 'raycast.com'],
  industries: ['B2B SaaS', 'Developer tools'],
  companySizes: ['51–200'],
  regions: ['North America'],
  buyerTitles: ['CMO / Head of Marketing', 'Founder / CEO'],
  signals: ['Just raised funding', 'Launching a product'],
  dealSize: '25-75k',
  excludedDomains: ['relay.so', 'stackline.dev', 'buck.co'],
}
