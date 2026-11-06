'use client'

import type { ReactNode } from 'react'
import { AppHeader } from '@/components/shortlist/app-header'
import { DemoBanner } from '@/components/shortlist/demo-banner'
import { OnboardingRail } from '@/components/shortlist/onboarding-rail'
import { StepSkeleton } from '@/components/shortlist/page-skeleton'
import { useShortlist } from '@/components/shortlist/shortlist-provider'
import { ErrorState } from '@/components/ui/error-state'

export function OnboardingShell({ children }: { children: ReactNode }) {
  const {
    hydrated,
    step,
    isDemo,
    canVisit,
    goTo,
    actionError,
    clearActionError,
  } = useShortlist()

  if (!step || step === 'Digest') {
    return <div className="min-h-dvh" aria-busy="true" />
  }

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-5xl gap-x-8 px-4 pb-[env(safe-area-inset-bottom)] sm:px-6 lg:grid-cols-[11rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)] xl:gap-x-12">
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-dvh">
        <OnboardingRail step={step} isDemo={isDemo} canVisit={canVisit} onSelect={goTo} />
      </aside>
      <div className="lg:hidden">
        <AppHeader step={step} isDemo={isDemo} />
      </div>
      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 pt-8 pb-16 lg:pt-6">
        {isDemo ? <DemoBanner /> : null}
        {actionError ? (
          <ErrorState title="Couldn’t finish that step" description={actionError} onRetry={clearActionError} />
        ) : null}
        {hydrated ? children : <StepSkeleton />}
      </main>
    </div>
  )
}
