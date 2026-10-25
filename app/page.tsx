'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Landing } from '@/components/shortlist/landing'
import { useShortlist } from '@/components/shortlist/shortlist-provider'
import { loadSession, type Session } from '@/lib/shortlist/session'
import { pathForStep } from '@/lib/shortlist/steps'

export default function HomePage() {
  const { hydrated, authenticated, digest } = useShortlist()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!hydrated) return
    setSession(loadSession())
  }, [hydrated])

  if (!hydrated) {
    return <div className="min-h-dvh bg-bg-weak-50" aria-busy="true" />
  }

  const continueHref = authenticated
    ? '/digest'
    : session
      ? pathForStep(session.step)
      : undefined

  return (
    <Landing
      continueHref={continueHref}
      continueSlot={
        authenticated || digest ? (
          <Link
            href="/digest"
            className="text-paragraph-xs text-text-sub-600 fine-hover:text-text-strong-950"
          >
            Open Shortlist
          </Link>
        ) : (
          <span className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-paragraph-xs text-text-sub-600 fine-hover:text-text-strong-950"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-paragraph-xs text-text-strong-950 fine-hover:underline"
            >
              Create account
            </Link>
          </span>
        )
      }
    />
  )
}
