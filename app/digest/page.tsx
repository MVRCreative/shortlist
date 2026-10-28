'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Dashboard } from '@/components/shortlist/dashboard'
import { StepHeading } from '@/components/shortlist/step-heading'
import { useShortlist } from '@/components/shortlist/shortlist-provider'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'

export default function DigestPage() {
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
  } = useShortlist()

  const requestedFirstDrop = useRef(false)

  useEffect(() => {
    if (!hydrated || digest || pending === 'digest' || requestedFirstDrop.current) return
    requestedFirstDrop.current = true
    handleGenerateDigest(0)
  }, [hydrated, digest, pending, handleGenerateDigest])

  if (!hydrated) return <div className="min-h-dvh" aria-busy="true" />

  if (!digest) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-6 px-4">
        <StepHeading
          eyebrow="Shortlist"
          title={pending === 'digest' ? 'Building your first Shortlist' : 'Your first Shortlist is ready to load'}
          description={
            pending === 'digest'
              ? `Finding real lookalike accounts for ${userEmail ?? 'your profile'}. This can take up to a minute.`
              : actionError
                ? actionError
                : 'Tap below to load your first drop from live company data.'
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
            {authenticated ? (
              <Button type="button" variant="outline" onClick={handleSignOut} disabled={pending === 'digest'}>
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
        <div className="mx-auto w-full max-w-5xl px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
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
          Live Shortlist · {userEmail} · demo mode off
        </div>
      ) : null}
      <Dashboard
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
      {!authenticated ? (
        <p className="pb-8 text-center text-paragraph-xs text-text-sub-600">
          <Link href="/login" className="underline-offset-4 hover:underline">
            Sign in
          </Link>{" "}
          for your real Shortlist
        </p>
      ) : null}
    </div>
  )
}
