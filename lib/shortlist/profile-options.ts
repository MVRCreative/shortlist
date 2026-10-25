import type { DealSize } from '@/lib/shortlist/schemas'

const SIZE_OPTIONS = [
  { label: '1–10', min: '1', max: '10' },
  { label: '11–50', min: '11', max: '50' },
  { label: '51–200', min: '51', max: '200' },
  { label: '201–500', min: '201', max: '500' },
  { label: '501–1,000', min: '501', max: '1,000' },
  { label: '1,000+', min: '1,000', max: null },
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
  if (selected.length === 0) return null
  const picked = SIZE_OPTIONS.filter((option) => selected.includes(option.label))
  const first = picked[0]
  const last = picked[picked.length - 1]
  if (picked.length === selected.length && first && last) {
    return last.max ? `${first.min}–${last.max} employees` : `${first.min}+ employees`
  }
  return selected.join(', ')
}
