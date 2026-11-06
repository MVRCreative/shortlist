'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Dashboard, type DashboardView } from '@/components/shortlist/dashboard'
import { PageSkeleton } from '@/components/shortlist/page-skeleton'
import { StepHeading } from '@/components/shortlist/step-heading'
import { useShortlist } from '@/components/shortlist/shortlist-provider'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'

export function DigestRoute({ view }: { view: DashboardView }) {
  const {
    hydrated,
    digest,
    settings,
    input,
    enriched,
    fitCount,
    missCount,
    isDemo,
    authenticated,
    userEmail,
    digestSource,
    completed,
    pending,
    toggleCompleted,
    handleSignOut,
    actionError,
    clearActionError,
    handleGenerateDigest,
    goTo,
  } = useShortlist()

  const requestedFirstDrop = useRef(false)

  useEffect(() => {
    if (view !== 'digest' || !hydrated || digest || pending === 'digest' || requestedFirstDrop.current) return
    if (!enriched || fitCount === 0) return
    requestedFirstDrop.current = true
    handleGenerateDigest(0)
  }, [view, hydrated, digest, pending, handleGenerateDigest, enriched, fitCount])

  if (!hydrated) return <PageSkeleton />

  if (!digest && view === 'digest') {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-6 px-4">
        <StepHeading
          eyebrow="Shortlist"
          title={
            pending === 'digest'
              ? 'Building your first Shortlist'
              : !enriched || fitCount === 0
                ? 'Calibrate the audience first'
                : 'Your first Shortlist is ready to load'
          }
          description={
            pending === 'digest'
              ? 'Finding accounts you have not seen and adding decision-makers. This can take a few minutes.'
              : !enriched || fitCount === 0
                ? 'Rate at least one lookalike as a fit before the weekly digest runs.'
                : actionError
                  ? actionError
                  : 'Load your weekly Shortlist of accounts, contacts, and suggested messaging.'
          }
        />
        {actionError ? (
          <ErrorState
            title="Couldn’t build your Shortlist"
            description={actionError}
            onRetry={() => {
              clearActionError()
              requestedFirstDrop.current = false
              handleGenerateDigest(0)
            }}
          />
        ) : (
          <div className="flex gap-3">
            {!enriched || fitCount === 0 ? (
              <Button type="button" onClick={() => goTo(!enriched ? 'Profile' : 'Audience')}>
                {!enriched ? 'Build profile' : 'Review audience'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  clearActionError()
                  requestedFirstDrop.current = false
                  handleGenerateDigest(0)
                }}
                pending={pending === 'digest'}
              >
                {pending === 'digest' ? 'Building…' : 'Load Shortlist'}
              </Button>
            )}
            {authenticated ? (
              <Button type="button" variant="secondary" onClick={handleSignOut} disabled={pending === 'digest'}>
                Sign out
              </Button>
            ) : null}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      {actionError ? (
        <div className="mx-auto w-full max-w-6xl px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
          <ErrorState
            title="Couldn’t load digest"
            description={actionError}
            onRetry={() => {
              clearActionError()
              handleGenerateDigest(0)
            }}
          />
        </div>
      ) : null}
      {authenticated && digestSource === 'supabase' ? (
        <div className="border-b border-stroke-soft-200 bg-bg-weak-50/40 px-4 py-2 text-center text-paragraph-xs text-text-sub-600">
          Live Shortlist · {userEmail}
        </div>
      ) : null}
      <Dashboard
        view={view}
        digest={digest}
        settings={settings}
        input={input}
        enriched={enriched}
        fitCount={fitCount}
        missCount={missCount}
        isDemo={isDemo}
        completed={completed}
        onToggle={toggleCompleted}
        onSignOut={handleSignOut}
      />
      {pending === 'digest' && !digest ? (
        <span className="sr-only" aria-live="polite">
          Loading digest
        </span>
      ) : null}
      {!authenticated && digestSource !== 'ocean' ? (
        <p className="pb-8 text-center text-paragraph-xs text-text-sub-600">
          <Link href="/login" className="rounded-sm underline-offset-4 focus-ring fine-hover:hover:underline">
            Sign in
          </Link>{" "}
          to keep this Shortlist on your account
        </p>
      ) : null}
    </div>
  )
}
