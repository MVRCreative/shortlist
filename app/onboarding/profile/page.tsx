'use client'

import { ProfileStep } from '@/components/shortlist/profile-step'
import { useShortlist } from '@/components/shortlist/shortlist-provider'

export default function ProfilePage() {
  const {
    hydrated,
    input,
    enriched,
    isStale,
    pending,
    handleEnrich,
    setInput,
    handleFindAccounts,
  } = useShortlist()

  if (!hydrated) return null

  return (
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
  )
}
