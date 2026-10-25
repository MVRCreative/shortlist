import { TONES, toneFor } from '@/lib/shortlist/tones'

export function tagColorClass(label: string) {
  return TONES[toneFor(label)].chip
}
