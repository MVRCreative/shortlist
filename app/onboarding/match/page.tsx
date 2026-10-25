'use client'

import { MatchStep } from '@/components/shortlist/match-step'
import { useShortlist } from '@/components/shortlist/shortlist-provider'

export default function MatchPage() {
  const { hydrated, accounts, verdicts, handleVerdict, goTo } = useShortlist()

  if (!hydrated) return null

  return (
    <MatchStep
      accounts={accounts}
      verdicts={verdicts}
      onVerdict={handleVerdict}
      onBack={() => goTo('Profile')}
      onContinue={() => goTo('Turn on')}
    />
  )
}
