import type { Step } from '@/components/gtm/app-header'
import type { Digest, DigestSettings, EnrichedProfile, ProfileInput, SampleAccount, Verdict } from '@/lib/gtm/schemas'

const KEY = 'shortlist:session:v1'

export type Session = {
  step: Step
  input: ProfileInput
  enriched: EnrichedProfile | null
  enrichedFrom: string | null
  accounts: SampleAccount[]
  verdicts: Record<string, Verdict>
  settings: DigestSettings
  digest: Digest | null
  isDemo: boolean
  completed: string[]
}

export function loadSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    // A digest that was still generating when the tab closed can't resume.
    if (session.step === 'Digest' && !session.digest) session.step = 'Turn on'
    return session
  } catch {
    return null
  }
}

export function saveSession(session: Session) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // Storage full or disabled: the session just won't survive a reload.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {}
}
