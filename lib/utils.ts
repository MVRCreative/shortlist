import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Loople's type-scale utilities (text-label, text-chip, …) look like colors to
// tailwind-merge, so without this a `text-foreground` override drops the size.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'page-title',
            'section-title',
            'card-title',
            'body',
            'body-reading',
            'description',
            'label',
            'eyebrow',
            'meta',
            'numeral',
            'numeral-hero',
            'numeral-display',
            'editorial-title',
            'editorial-display',
            'kbd',
            'control',
            'chip',
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
