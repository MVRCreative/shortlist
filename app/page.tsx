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

  const devPreview = process.env.NODE_ENV === 'development'
  const continueHref = !hydrated
    ? undefined
    : authenticated
    ? '/digest'
    : session
      ? pathForStep(session.step)
      : undefined

  return (
    <Landing
      continueHref={continueHref}
      continueSlot={
        !hydrated ? undefined : authenticated || digest ? (
          <Link
            href="/digest"
            className="text-paragraph-xs text-text-sub-600 transition-colors duration-150 fine-hover:hover:text-text-strong-950"
          >
            Open Shortlist
          </Link>
        ) : devPreview ? (
          <Link
            href="/onboarding/profile"
            className="text-paragraph-xs text-text-sub-600 transition-colors duration-150 fine-hover:hover:text-text-strong-950"
          >
            Open Shortlist
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-paragraph-xs text-text-sub-600 transition-colors duration-150 fine-hover:hover:text-text-strong-950"
          >
            Sign in
          </Link>
        )
      }
    />
  )
}
