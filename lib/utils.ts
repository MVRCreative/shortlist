import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const typography = [
  'title-h1',
  'title-h2',
  'title-h3',
  'title-h4',
  'title-h5',
  'title-h6',
  'label-xl',
  'label-lg',
  'label-md',
  'label-sm',
  'label-xs',
  'label-2xs',
  'paragraph-xl',
  'paragraph-lg',
  'paragraph-md',
  'paragraph-sm',
  'paragraph-xs',
  'subheading-md',
  'subheading-sm',
  'subheading-xs',
  'subheading-2xs',
]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: typography }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
