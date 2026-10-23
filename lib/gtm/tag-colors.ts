// AlignUI 2.0 palette: `lighter` fill, `light` border, `dark` text in light mode;
// a translucent `base` fill with `light` text in dark mode.
const TAG_COLORS = [
  'border-[#C0D5FF] bg-[#EBF1FF] text-[#122368] dark:border-[#335CFF]/40 dark:bg-[#335CFF]/16 dark:text-[#C0D5FF]',
  'border-[#FFD9C2] bg-[#FFF3EB] text-[#71330A] dark:border-[#FA7319]/40 dark:bg-[#FA7319]/16 dark:text-[#FFD9C2]',
  'border-[#CAC0FF] bg-[#EFEBFF] text-[#2B1664] dark:border-[#7D52F4]/40 dark:bg-[#7D52F4]/16 dark:text-[#CAC0FF]',
  'border-[#C2F5DA] bg-[#E0FAEC] text-[#0B4627] dark:border-[#1FC16B]/40 dark:bg-[#1FC16B]/16 dark:text-[#C2F5DA]',
  'border-[#FFC0DF] bg-[#FFEBF4] text-[#68123D] dark:border-[#FB4BA3]/40 dark:bg-[#FB4BA3]/16 dark:text-[#FFC0DF]',
  'border-[#C0EAFF] bg-[#EBF8FF] text-[#124B68] dark:border-[#47C2FF]/40 dark:bg-[#47C2FF]/16 dark:text-[#C0EAFF]',
  'border-[#FFECC0] bg-[#FFFAEB] text-[#624C18] dark:border-[#F6B51E]/40 dark:bg-[#F6B51E]/16 dark:text-[#FFECC0]',
  'border-[#C2F5EE] bg-[#E4FBF8] text-[#0B463E] dark:border-[#22D3BB]/40 dark:bg-[#22D3BB]/16 dark:text-[#C2F5EE]',
] as const

export function tagColorClass(label: string) {
  let hash = 0
  for (const char of label.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TAG_COLORS[hash % TAG_COLORS.length]
}
