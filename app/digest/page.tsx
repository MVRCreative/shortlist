'use client'

import Link from 'next/link'
import { Dashboard } from '@/components/shortlist/dashboard'
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

  if (!hydrated) return <div className="min-h-dvh" aria-busy="true" />

  if (authenticated && !digest) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 px-4">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-semibold">
          Your Shortlist is being prepared
        </h1>
        <p className="text-paragraph-sm text-text-sub-600">
          Signed in as {userEmail}. No delivered accounts yet. After Ocean delivery
          runs for this account, refresh to see your digest.
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => {
              clearActionError()
              handleGenerateDigest(0)
            }}
            pending={pending === 'digest'}
          >
            Refresh
          </Button>
          <Button type="button" variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
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
