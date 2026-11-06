'use client'

import { useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { persistOnboardingState } from '@/app/actions'
import { MatchStep } from '@/components/shortlist/match-step'
import { useShortlist } from '@/components/shortlist/shortlist-provider'
import { Spinner } from '@/components/ui/spinner'

export default function AudiencePage() {
  const {
    hydrated,
    accounts,
    verdicts,
    pending,
    enriched,
    input,
    authenticated,
    handleFindAccounts,
    handleVerdict,
    goTo,
  } = useShortlist()
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!hydrated || !enriched) return
    if (accounts.length > 0 || pending === 'match') return
    handleFindAccounts()
  }, [hydrated, enriched, accounts.length, pending, handleFindAccounts])

  if (!hydrated) return null

  if (!enriched) {
    return (
      <p className="text-paragraph-sm text-text-sub-600">
        Build your profile first so Shortlist can find lookalike accounts.
      </p>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="flex items-center gap-3 text-paragraph-sm text-text-sub-600">
        <Spinner className="size-4" />
        Finding lookalike companies from Ocean…
      </div>
    )
  }

  function confirmAudience() {
    if (!authenticated) {
      goTo('Campaign')
      return
    }
    startTransition(async () => {
      const reviews = accounts
        .filter((account) => verdicts[account.id])
        .map((account) => ({
          domain: account.domain,
          verdict: verdicts[account.id]!,
          name: account.name,
        }))
      const saved = await persistOnboardingState({
        input,
        enriched,
        reviews,
        markComplete: true,
      })
      if (!saved.ok) {
        toast.error(saved.error)
        return
      }
      goTo('Campaign')
    })
  }

  return (
    <MatchStep
      accounts={accounts}
      verdicts={verdicts}
      onVerdict={handleVerdict}
      onBack={() => goTo('Profile')}
      onContinue={confirmAudience}
    />
  )
}
