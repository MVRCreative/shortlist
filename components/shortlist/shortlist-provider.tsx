'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { enrichProfile, findSampleAccounts, generateDigest } from '@/app/actions'
import { getSessionDigest, signOutAction } from '@/app/auth/actions'
import { DEFAULT_TIER, deliveryFor } from '@/lib/shortlist/pricing'
import { emptyProfile } from '@/lib/shortlist/sample-profile'
import {
  contentChannels,
  type Digest,
  type DigestSettings,
  type EnrichedProfile,
  type ProfileInput,
  type SampleAccount,
  type Verdict,
} from '@/lib/shortlist/schemas'
import { clearSession, loadSession, saveSession } from '@/lib/shortlist/session'
import { defaultSettingsEmail, pathForStep, stepFromPathname, type Step } from '@/lib/shortlist/steps'

type Pending = 'enrich' | 'match' | 'digest' | null

type ShortlistContextValue = {
  hydrated: boolean
  step: Step | null
  input: ProfileInput
  setInput: (input: ProfileInput) => void
  enriched: EnrichedProfile | null
  enrichedFrom: string | null
  accounts: SampleAccount[]
  verdicts: Record<string, Verdict>
  settings: DigestSettings
  setSettings: (settings: DigestSettings) => void
  digest: Digest | null
  pending: Pending
  isDemo: boolean
  authenticated: boolean
  userEmail: string | null
  digestSource: 'supabase' | 'ai' | 'demo' | null
  completed: Set<string>
  isStale: boolean
  fitCount: number
  missCount: number
  canVisit: (target: Step) => boolean
  goTo: (next: Step) => void
  toggleCompleted: (key: string) => void
  handleSignOut: () => void
  handleEnrich: (profile: ProfileInput) => void
  handleFindAccounts: () => void
  handleVerdict: (id: string, verdict: Verdict | undefined) => void
  handleGenerateDigest: (nextWeek: number) => void
  actionError: string | null
  clearActionError: () => void
}

const ShortlistContext = createContext<ShortlistContextValue | null>(null)

function initialSettings(): DigestSettings {
  return {
    tier: DEFAULT_TIER,
    ...deliveryFor(DEFAULT_TIER),
    channels: [...contentChannels],
    email: defaultSettingsEmail(),
  }
}

export function ShortlistProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const step = stepFromPathname(pathname)

  const [input, setInput] = useState<ProfileInput>(emptyProfile)
  const [enriched, setEnriched] = useState<EnrichedProfile | null>(null)
  const [enrichedFrom, setEnrichedFrom] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<SampleAccount[]>([])
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [settings, setSettings] = useState<DigestSettings>(initialSettings)
  const [digest, setDigest] = useState<Digest | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [digestSource, setDigestSource] = useState<'supabase' | 'ai' | 'demo' | null>(null)
  const [completed, setCompleted] = useState<Set<string>>(() => new Set())
  const [hydrated, setHydrated] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const session = await getSessionDigest()
      if (cancelled) return

      if (session.authenticated && session.digest) {
        setAuthenticated(true)
        setUserEmail(session.email)
        setDigest(session.digest)
        setDigestSource('supabase')
        setIsDemo(false)
        if (session.email) {
          setSettings((prev) => ({ ...prev, email: session.email! }))
        }
        setHydrated(true)
        return
      }

      if (session.authenticated) {
        setAuthenticated(true)
        setUserEmail(session.email)
        setIsDemo(false)
        if (session.email) {
          setSettings((prev) => ({ ...prev, email: session.email! }))
        }
      }

      const saved = loadSession()
      if (saved && !session.authenticated) {
        setInput(saved.input)
        setEnriched(saved.enriched)
        setEnrichedFrom(saved.enrichedFrom)
        setAccounts(saved.accounts)
        setVerdicts(saved.verdicts)
        setSettings(saved.settings)
        setDigest(saved.digest)
        setIsDemo(saved.isDemo)
        setDigestSource(saved.isDemo ? 'demo' : saved.digest ? 'ai' : null)
        setCompleted(new Set(saved.completed))
      }

      setHydrated(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    // Authenticated Supabase digests are server-truth; don't overwrite localStorage with demos.
    if (authenticated && digestSource === 'supabase') return
    const sessionStep = step ?? 'Profile'
    saveSession({
      step: sessionStep,
      input,
      enriched,
      enrichedFrom,
      accounts,
      verdicts,
      settings,
      digest,
      isDemo,
      completed: [...completed],
    })
  }, [
    hydrated,
    step,
    input,
    enriched,
    enrichedFrom,
    accounts,
    verdicts,
    settings,
    digest,
    isDemo,
    completed,
    authenticated,
    digestSource,
  ])

  const canVisit = useCallback(
    (target: Step) => {
      if (target === 'Profile') return true
      if (target === 'Digest') {
        return !!digest || pending === 'digest' || (authenticated && digestSource === 'supabase')
      }
      return accounts.length > 0
    },
    [accounts.length, digest, pending, authenticated, digestSource],
  )

  const goTo = useCallback(
    (next: Step) => {
      router.push(pathForStep(next))
      window.scrollTo({ top: 0, behavior: 'instant' })
    },
    [router],
  )

  useEffect(() => {
    if (!hydrated || !step) return
    // Real Supabase digests skip onboarding gates.
    if (authenticated && digestSource === 'supabase') {
      if (step !== 'Digest' && pathname.startsWith('/onboarding')) {
        goTo('Digest')
      }
      return
    }
    if (step === 'Match' || step === 'Turn on') {
      if (accounts.length === 0) goTo('Profile')
    } else if (step === 'Digest') {
      if (!digest && pending !== 'digest') goTo('Turn on')
    }
  }, [
    hydrated,
    step,
    accounts.length,
    digest,
    pending,
    goTo,
    authenticated,
    digestSource,
    pathname,
  ])

  function toggleCompleted(key: string) {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleSignOut() {
    clearSession()
    setInput(emptyProfile)
    setEnriched(null)
    setEnrichedFrom(null)
    setAccounts([])
    setVerdicts({})
    setSettings(initialSettings())
    setDigest(null)
    setIsDemo(false)
    setAuthenticated(false)
    setUserEmail(null)
    setDigestSource(null)
    setCompleted(new Set())
    setActionError(null)
    startTransition(async () => {
      await signOutAction()
    })
  }

  function run(kind: Exclude<Pending, null>, task: () => Promise<void>) {
    setPending(kind)
    setActionError(null)
    startTransition(async () => {
      try {
        await task()
      } catch (error) {
        console.error('[shortlist] action failed', error)
        const message = 'Something went wrong. Please try again.'
        setActionError(message)
        toast.error(message)
      } finally {
        setPending(null)
      }
    })
  }

  function handleEnrich(profile: ProfileInput) {
    if (authenticated && digestSource === 'supabase') {
      toast.message('Your live Shortlist is already loaded from Supabase.')
      goTo('Digest')
      return
    }
    setInput(profile)
    run('enrich', async () => {
      const result = await enrichProfile(profile)
      if (!result.ok) {
        setActionError(result.error)
        toast.error(result.error)
        return
      }
      setIsDemo(result.source === 'demo')
      setDigestSource(result.source === 'demo' ? 'demo' : 'ai')
      setEnriched(result.data)
      setEnrichedFrom(JSON.stringify(profile))
      setAccounts([])
      setVerdicts({})
    })
    requestAnimationFrame(() =>
      document.getElementById('shortlist-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  function handleFindAccounts() {
    if (authenticated && digestSource === 'supabase') {
      goTo('Digest')
      return
    }
    if (!enriched) return
    const alreadyFromOcean =
      accounts.length > 0 &&
      accounts.every((account) => account.id.startsWith('ocean:') && !account.fitReason.startsWith('Similar to'))
    if (alreadyFromOcean) return goTo('Match')
    run('match', async () => {
      const result = await findSampleAccounts(input, enriched)
      if (!result.ok) {
        setActionError(result.error)
        toast.error(result.error)
        return
      }
      setIsDemo(false)
      setAccounts(result.data)
      setVerdicts({})
      goTo('Match')
    })
  }

  function handleVerdict(id: string, verdict: Verdict | undefined) {
    setVerdicts((prev) => {
      const next = { ...prev }
      if (verdict) next[id] = verdict
      else delete next[id]
      return next
    })
  }

  function handleGenerateDigest(nextWeek: number) {
    if (authenticated) {
      run('digest', async () => {
        const session = await getSessionDigest()
        if (session.digest) {
          setDigest(session.digest)
          setDigestSource('supabase')
          setIsDemo(false)
          goTo('Digest')
          return
        }
        setActionError(
          'No delivered Shortlist yet. Run the Ocean delivery for this account, then refresh.',
        )
        toast.error('No delivered Shortlist yet.')
      })
      return
    }
    if (!enriched) return
    setDigest(null)
    setCompleted(new Set())
    goTo('Digest')
    run('digest', async () => {
      const result = await generateDigest({
        input,
        enriched,
        fits: accounts.filter((a) => verdicts[a.id] === 'fit'),
        misses: accounts.filter((a) => verdicts[a.id] === 'nofit'),
        leadsPerDigest: settings.leadsPerDigest,
        channels: settings.channels,
        week: nextWeek,
      })
      if (!result.ok) {
        setActionError(result.error)
        toast.error(result.error)
        goTo('Turn on')
        return
      }
      if (result.source === 'demo') {
        setIsDemo(true)
        setDigestSource('demo')
      } else {
        setDigestSource('ai')
      }
      setDigest(result.data)
    })
  }

  const fitCount = Object.values(verdicts).filter((v) => v === 'fit').length
  const missCount = Object.values(verdicts).filter((v) => v === 'nofit').length
  const isStale = !!enriched && enrichedFrom !== JSON.stringify(input)

  const value: ShortlistContextValue = {
    hydrated,
    step,
    input,
    setInput,
    enriched,
    enrichedFrom,
    accounts,
    verdicts,
    settings,
    setSettings,
    digest,
    pending,
    isDemo: authenticated ? false : isDemo,
    authenticated,
    userEmail,
    digestSource,
    completed,
    isStale,
    fitCount,
    missCount,
    canVisit,
    goTo,
    toggleCompleted,
    handleSignOut,
    handleEnrich,
    handleFindAccounts,
    handleVerdict,
    handleGenerateDigest,
    actionError,
    clearActionError: () => setActionError(null),
  }

  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>
}

export function useShortlist() {
  const ctx = useContext(ShortlistContext)
  if (!ctx) throw new Error('useShortlist must be used within ShortlistProvider')
  return ctx
}
