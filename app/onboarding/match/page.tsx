'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy route — Audience replaced Match. */
export default function MatchRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/onboarding/audience')
  }, [router])
  return null
}
