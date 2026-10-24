'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { enrichProfile, findSampleAccounts, generateDigest } from '@/app/actions'
import { AppHeader, type Step } from '@/components/gtm/app-header'
import { ProfileStep } from '@/components/gtm/profile-step'
import { MatchStep } from '@/components/gtm/match-step'
import { ActivateStep } from '@/components/gtm/activate-step'
import { Dashboard } from '@/components/gtm/dashboard'
import { OnboardingRail } from '@/components/gtm/onboarding-rail'
import { ProfilePreview } from '@/components/gtm/profile-preview'
import { emptyProfile } from '@/lib/gtm/sample-profile'
import {
  contentChannels,
  type Digest,
  type DigestSettings,
  type EnrichedProfile,
  type ProfileInput,
  type SampleAccount,
  type Verdict,
} from '@/lib/gtm/schemas'

type Pending = 'enrich' | 'match' | 'digest' | null

export function GtmApp() {
  const [step, setStep] = useState<Step>('Profile')
  const [input, setInput] = useState<ProfileInput>(emptyProfile)
  const [enriched, setEnriched] = useState<EnrichedProfile | null>(null)
  const [enrichedFrom, setEnrichedFrom] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<SampleAccount[]>([])
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [settings, setSettings] = useState<DigestSettings>({
    cadence: 'weekly',
    leadsPerDigest: 10,
    channels: [...contentChannels],
    email: '',
  })
  const [digest, setDigest] = useState<Digest | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [week, setWeek] = useState(0)
  const [isDemo, setIsDemo] = useState(false)
  const [, startTransition] = useTransition()

  function run(kind: Exclude<Pending, null>, task: () => Promise<void>) {
    setPending(kind)
    startTransition(async () => {
      try {
        await task()
      } catch (error) {
        console.error('[mini-gtm] action failed', error)
        toast.error('Something went wrong. Please try again.')
      } finally {
        setPending(null)
      }
    })
  }

  function goTo(next: Step) {
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function handleEnrich(profile: ProfileInput) {
    setInput(profile)
    run('enrich', async () => {
      const result = await enrichProfile(profile)
      if (!result.ok) return void toast.error(result.error)
      setIsDemo(result.source === 'demo')
      setEnriched(result.data)
      setEnrichedFrom(JSON.stringify(profile))
      setAccounts([])
      setVerdicts({})
    })
    requestAnimationFrame(() =>
      document.getElementById('gtm-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  function handleFindAccounts() {
    if (!enriched) return
    if (accounts.length > 0) return goTo('Match')
    run('match', async () => {
      const result = await findSampleAccounts(input, enriched)
      if (!result.ok) return void toast.error(result.error)
      if (result.source === 'demo') setIsDemo(true)
      setAccounts(result.data)
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
    if (!enriched) return
    setWeek(nextWeek)
    setDigest(null)
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
        toast.error(result.error)
        goTo('Turn on')
        return
      }
      if (result.source === 'demo') setIsDemo(true)
      setDigest(result.data)
    })
  }

  const fitCount = Object.values(verdicts).filter((v) => v === 'fit').length
  const missCount = Object.values(verdicts).filter((v) => v === 'nofit').length

  function canVisit(target: Step) {
    if (target === 'Profile') return true
    return accounts.length > 0
  }

  const isStale = !!enriched && enrichedFrom !== JSON.stringify(input)

  if (step === 'Digest') {
    return (
      <Dashboard
        key={week}
        digest={digest}
        settings={settings}
        input={input}
        isDemo={isDemo}
        pending={pending === 'digest'}
        onNextWeek={() => handleGenerateDigest(week + 1)}
        onProfile={() => goTo('Profile')}
        onSettings={() => goTo('Turn on')}
      />
    )
  }

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-6xl gap-x-12 px-4 sm:px-6 lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_17rem]">
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-dvh">
        <OnboardingRail step={step} isDemo={isDemo} canVisit={canVisit} onSelect={goTo} />
      </aside>
      <div className="lg:hidden">
        <AppHeader step={step} isDemo={isDemo} />
      </div>
      <main className="mx-auto flex w-full max-w-xl flex-col pt-8 pb-16 lg:pt-6">
        {step === 'Profile' && (
          <ProfileStep
            initial={input}
            enriched={enriched}
            isStale={isStale}
            pendingEnrich={pending === 'enrich'}
            pendingMatch={pending === 'match'}
            onSubmit={handleEnrich}
            onDraftChange={setInput}
            onFindAccounts={handleFindAccounts}
          />
        )}
        {step === 'Match' && (
          <MatchStep
            accounts={accounts}
            verdicts={verdicts}
            onVerdict={handleVerdict}
            onBack={() => goTo('Profile')}
            onContinue={() => goTo('Turn on')}
          />
        )}
        {step === 'Turn on' && (
          <ActivateStep
            settings={settings}
            fitCount={fitCount}
            pending={pending === 'digest'}
            onChange={setSettings}
            onBack={() => goTo('Match')}
            onActivate={() => handleGenerateDigest(0)}
          />
        )}
      </main>
      <aside aria-label="Profile preview" className="hidden xl:sticky xl:top-0 xl:block xl:max-h-dvh xl:overflow-y-auto">
        <ProfilePreview
          input={input}
          enriched={enriched}
          fitCount={fitCount}
          missCount={missCount}
          settings={settings}
        />
      </aside>
    </div>
  )
}
