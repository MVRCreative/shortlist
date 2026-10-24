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

export function describeSizeRange(selected: string[]) {
  const picked = SIZE_OPTIONS.filter((option) => selected.includes(option.label))
  if (picked.length === 0) return null
  const first = picked[0]
  const last = picked[picked.length - 1]
  return last.max ? `${first.min}–${last.max} employees` : `${first.min}+ employees`
}
