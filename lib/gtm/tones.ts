// Soft accents from the AlignUI 2.0 palette. Blue stays reserved for primary actions,
// so these are for categorizing and decorating, never for buttons.
export const TONES = {
  blue: {
    chip: 'border-[#C0D5FF] bg-[#EBF1FF] text-[#122368] dark:border-[#335CFF]/40 dark:bg-[#335CFF]/16 dark:text-[#C0D5FF]',
    tile: 'bg-[#EBF1FF] text-[#335CFF] dark:bg-[#335CFF]/16 dark:text-[#97BAFF]',
    ink: 'text-[#335CFF] dark:text-[#97BAFF]',
  },
  orange: {
    chip: 'border-[#FFD9C2] bg-[#FFF3EB] text-[#71330A] dark:border-[#FA7319]/40 dark:bg-[#FA7319]/16 dark:text-[#FFD9C2]',
    tile: 'bg-[#FFF3EB] text-[#E5600B] dark:bg-[#FA7319]/16 dark:text-[#FFB98A]',
    ink: 'text-[#E5600B] dark:text-[#FFB98A]',
  },
  purple: {
    chip: 'border-[#CAC0FF] bg-[#EFEBFF] text-[#2B1664] dark:border-[#7D52F4]/40 dark:bg-[#7D52F4]/16 dark:text-[#CAC0FF]',
    tile: 'bg-[#EFEBFF] text-[#7D52F4] dark:bg-[#7D52F4]/16 dark:text-[#B9A8FF]',
    ink: 'text-[#7D52F4] dark:text-[#B9A8FF]',
  },
  green: {
    chip: 'border-[#C2F5DA] bg-[#E0FAEC] text-[#0B4627] dark:border-[#1FC16B]/40 dark:bg-[#1FC16B]/16 dark:text-[#C2F5DA]',
    tile: 'bg-[#E0FAEC] text-[#16A35F] dark:bg-[#1FC16B]/16 dark:text-[#84EBB4]',
    ink: 'text-[#16A35F] dark:text-[#84EBB4]',
  },
  pink: {
    chip: 'border-[#FFC0DF] bg-[#FFEBF4] text-[#68123D] dark:border-[#FB4BA3]/40 dark:bg-[#FB4BA3]/16 dark:text-[#FFC0DF]',
    tile: 'bg-[#FFEBF4] text-[#E93D82] dark:bg-[#FB4BA3]/16 dark:text-[#FF9DCB]',
    ink: 'text-[#E93D82] dark:text-[#FF9DCB]',
  },
  sky: {
    chip: 'border-[#C0EAFF] bg-[#EBF8FF] text-[#124B68] dark:border-[#47C2FF]/40 dark:bg-[#47C2FF]/16 dark:text-[#C0EAFF]',
    tile: 'bg-[#EBF8FF] text-[#0E8FD1] dark:bg-[#47C2FF]/16 dark:text-[#8FD9FF]',
    ink: 'text-[#0E8FD1] dark:text-[#8FD9FF]',
  },
  yellow: {
    chip: 'border-[#FFECC0] bg-[#FFFAEB] text-[#624C18] dark:border-[#F6B51E]/40 dark:bg-[#F6B51E]/16 dark:text-[#FFECC0]',
    tile: 'bg-[#FFFAEB] text-[#C98A04] dark:bg-[#F6B51E]/16 dark:text-[#FFD97A]',
    ink: 'text-[#C98A04] dark:text-[#FFD97A]',
  },
  teal: {
    chip: 'border-[#C2F5EE] bg-[#E4FBF8] text-[#0B463E] dark:border-[#22D3BB]/40 dark:bg-[#22D3BB]/16 dark:text-[#C2F5EE]',
    tile: 'bg-[#E4FBF8] text-[#0F9F8C] dark:bg-[#22D3BB]/16 dark:text-[#84EEDD]',
    ink: 'text-[#0F9F8C] dark:text-[#84EEDD]',
  },
} as const

export type Tone = keyof typeof TONES

const TONE_ORDER = Object.keys(TONES) as Tone[]

export function toneFor(label: string): Tone {
  let hash = 0
  for (const char of label.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TONE_ORDER[hash % TONE_ORDER.length]
}
