import type { DealSize } from '@/lib/gtm/schemas'

export const SERVICE_OPTIONS = [
  'Branding',
  'Web design',
  'Webflow / development',
  'Product & UX',
  'Motion',
  'Content & copy',
] as const

export const INDUSTRY_OPTIONS = [
  'B2B SaaS',
  'Fintech',
  'Healthcare',
  'E-commerce',
  'Developer tools',
  'Professional services',
  'Manufacturing',
  'Real estate',
  'Education',
  'Media & entertainment',
  'Logistics',
  'Climate & energy',
] as const

export const SIZE_OPTIONS = [
  { label: '1–10', min: '1', max: '10' },
  { label: '11–50', min: '11', max: '50' },
  { label: '51–200', min: '51', max: '200' },
  { label: '201–500', min: '201', max: '500' },
  { label: '501–1,000', min: '501', max: '1,000' },
  { label: '1,000+', min: '1,000', max: null },
] as const

export const REGION_OPTIONS = ['North America', 'UK & Ireland', 'Europe', 'APAC', 'Latin America', 'Global'] as const

export const BUYER_TITLE_OPTIONS = [
  'Founder / CEO',
  'CMO / Head of Marketing',
  'Head of Brand',
  'Head of Product',
  'Head of Design',
] as const

export const SIGNAL_OPTIONS = [
  'Just raised funding',
  'Hiring marketing or design',
  'Launching a product',
  'New leadership',
  'Outdated website',
] as const

export const DEAL_SIZE_OPTIONS: readonly { value: DealSize; label: string }[] = [
  { value: '<10k', label: 'Under $10K' },
  { value: '10-25k', label: '$10–25K' },
  { value: '25-75k', label: '$25–75K' },
  { value: '75k+', label: '$75K+' },
]

export function dealSizeLabel(value: DealSize | undefined) {
  return DEAL_SIZE_OPTIONS.find((option) => option.value === value)?.label
}

export function describeSizeRange(selected: string[]) {
  const picked = SIZE_OPTIONS.filter((option) => selected.includes(option.label))
  if (picked.length === 0) return null
  const first = picked[0]
  const last = picked[picked.length - 1]
  return last.max ? `${first.min}–${last.max} employees` : `${first.min}+ employees`
}
