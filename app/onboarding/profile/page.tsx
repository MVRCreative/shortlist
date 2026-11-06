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
    goTo,
  } = useShortlist()

  if (!hydrated) return null

  return (
    <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start xl:gap-10">
      <ProfileStep
        initial={input}
        enriched={enriched}
        isStale={isStale}
        pendingEnrich={pending === 'enrich'}
        pendingMatch={pending === 'match'}
        onSubmit={handleEnrich}
        onDraftChange={setInput}
        onFindAccounts={() => goTo('Audience')}
      />
      <aside
        aria-label="Profile preview"
        className="border-t border-stroke-soft-200 pt-6 xl:sticky xl:top-6 xl:border-t-0 xl:pt-0"
      >
        <ProfilePreview input={input} enriched={enriched} fitCount={fitCount} missCount={missCount} />
      </aside>
    </div>
  )
}
