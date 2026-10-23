'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { enrichProfile, findSampleAccounts, generateDigest } from '@/app/actions'
import { AppHeader, type Step } from '@/components/gtm/app-header'
import { ProfileStep } from '@/components/gtm/profile-step'
import { EnrichStep } from '@/components/gtm/enrich-step'
import { MatchStep } from '@/components/gtm/match-step'
import { ActivateStep } from '@/components/gtm/activate-step'
import { DigestStep } from '@/components/gtm/digest-step'
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
      await task()
      setPending(null)
    })
  }

  function goTo(next: Step) {
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleEnrich(profile: ProfileInput) {
    setInput(profile)
    run('enrich', async () => {
      const result = await enrichProfile(profile)
      if (!result.ok) return void toast.error(result.error)
      setIsDemo(result.source === 'demo')
      setEnriched(result.data)
      setAccounts([])
      setVerdicts({})
      goTo('Enrich')
    })
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

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-10 px-4 pb-16 sm:px-6">
      <AppHeader step={step} isDemo={isDemo} />
      <main className="flex flex-col">
        {step === 'Profile' && (
          <ProfileStep initial={input} pending={pending === 'enrich'} onSubmit={handleEnrich} />
        )}
        {step === 'Enrich' && enriched && (
          <EnrichStep
            input={input}
            profile={enriched}
            pendingEnrich={pending === 'enrich'}
            pendingMatch={pending === 'match'}
            onBack={() => goTo('Profile')}
            onRegenerate={() => handleEnrich(input)}
            onContinue={handleFindAccounts}
          />
        )}
        {step === 'Match' && (
          <MatchStep
            accounts={accounts}
            verdicts={verdicts}
            onVerdict={handleVerdict}
            onBack={() => goTo('Enrich')}
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
        {step === 'Digest' && (
          <DigestStep
            digest={digest}
            settings={settings}
            companyName={input.companyName}
            pending={pending === 'digest'}
            onRegenerate={() => handleGenerateDigest(week + 1)}
            onEdit={() => goTo('Turn on')}
          />
        )}
      </main>
    </div>
  )
}
