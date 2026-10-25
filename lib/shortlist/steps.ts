export const STEPS = ['Profile', 'Match', 'Turn on', 'Digest'] as const
export type Step = (typeof STEPS)[number]

/** App Router paths for each step. URL is source of truth for which step is showing. */
export const STEP_PATHS: Record<Step, string> = {
  Profile: '/onboarding/profile',
  Match: '/onboarding/match',
  'Turn on': '/onboarding/activate',
  Digest: '/digest',
}

export function pathForStep(step: Step): string {
  return STEP_PATHS[step]
}

export function stepFromPathname(pathname: string): Step | null {
  const entry = (Object.entries(STEP_PATHS) as [Step, string][]).find(([, path]) => path === pathname)
  return entry?.[0] ?? null
}

export function defaultSettingsEmail() {
  // Stands in for the signed-in user's email until account creation exists.
  return 'josh@studio.com'
}
