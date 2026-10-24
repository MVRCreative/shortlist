import { TONES, toneFor } from '@/lib/gtm/tones'

export function tagColorClass(label: string) {
  return TONES[toneFor(label)].chip
}
