// Soft accents collapsed onto the proposal paper system.
// Deep blue is reserved for primary actions; these decorate chips and tiles only.
export const TONES = {
  blue: {
    chip: 'border-stroke-soft-200 bg-[var(--color-brand-sky-wash)] text-text-sub-600',
    tile: 'bg-bg-soft-200 text-text-sub-600',
    ink: 'text-text-sub-600',
  },
  orange: {
    chip: 'border-stroke-soft-200 bg-[var(--color-brand-sky-wash)] text-text-sub-600',
    tile: 'bg-bg-soft-200 text-text-sub-600',
    ink: 'text-text-sub-600',
  },
  purple: {
    chip: 'border-stroke-soft-200 bg-[var(--color-brand-sky-wash)] text-text-sub-600',
    tile: 'bg-bg-soft-200 text-text-sub-600',
    ink: 'text-text-sub-600',
  },
  green: {
    chip: 'border-stroke-soft-200 bg-[var(--color-brand-sky-wash)] text-text-sub-600',
    tile: 'bg-bg-soft-200 text-text-sub-600',
    ink: 'text-text-sub-600',
  },
  pink: {
    chip: 'border-stroke-soft-200 bg-[var(--color-brand-sky-wash)] text-text-sub-600',
    tile: 'bg-bg-soft-200 text-text-sub-600',
    ink: 'text-text-sub-600',
  },
  sky: {
    chip: 'border-stroke-soft-200 bg-[var(--color-brand-sky-wash)] text-text-sub-600',
    tile: 'bg-bg-soft-200 text-text-sub-600',
    ink: 'text-text-sub-600',
  },
  yellow: {
    chip: 'border-stroke-soft-200 bg-[var(--color-brand-sky-wash)] text-text-sub-600',
    tile: 'bg-bg-soft-200 text-text-sub-600',
    ink: 'text-text-sub-600',
  },
  teal: {
    chip: 'border-stroke-soft-200 bg-[var(--color-brand-sky-wash)] text-text-sub-600',
    tile: 'bg-bg-soft-200 text-text-sub-600',
    ink: 'text-text-sub-600',
  },
} as const

export type Tone = keyof typeof TONES

const TONE_ORDER = Object.keys(TONES) as Tone[]

export function toneFor(label: string): Tone {
  let hash = 0
  for (const char of label.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TONE_ORDER[hash % TONE_ORDER.length]
}
