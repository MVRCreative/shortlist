'use client'

import { ProfileStep } from '@/components/shortlist/profile-step'
import { ProfilePreview } from '@/components/shortlist/profile-preview'
import { useShortlist } from '@/components/shortlist/shortlist-provider'

export default function ProfilePage() {
  const {
    hydrated,
    input,
    enriched,
    isStale,
    pending,
    fitCount,
    missCount,
    handleEnrich,
    setInput,
    handleFindAccounts,
  } = useShortlist()

  if (!hydrated) return null

  return (
    <div className="flex flex-col gap-8">
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
      <div className="border-t border-stroke-soft-200 pt-6">
        <ProfilePreview input={input} enriched={enriched} fitCount={fitCount} missCount={missCount} />
      </div>
    </div>
  )
}
