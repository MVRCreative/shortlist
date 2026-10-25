import clsx, { type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

export { type ClassValue } from 'clsx'

/** AlignUI typography class groups so tailwind-merge doesn't fight text-* roles. */
const typographyConfig = {
  title: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  label: ['xl', 'lg', 'md', 'sm', 'xs', '2xs'],
  paragraph: ['xl', 'lg', 'md', 'sm', 'xs'],
  subheading: ['md', 'sm', 'xs', '2xs'],
  doc: ['label', 'paragraph'],
}

const typographyPatterns = Object.entries(typographyConfig).flatMap(([category, sizes]) =>
  sizes.map((size) => `${category}-${size}`),
)

export const twMergeConfig = {
  extend: {
    classGroups: {
      'font-size': [
        {
          text: typographyPatterns,
        },
      ],
    },
  },
}

const customTwMerge = extendTailwindMerge(twMergeConfig)

/** AlignUI merge helper — use for AlignUI components. */
export function cnExt(...classes: ClassValue[]) {
  return customTwMerge(clsx(...classes))
}

export const cn = cnExt
