'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy route — Campaign replaced Turn on. Plan lives on Profile. */
export default function ActivateRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/onboarding/campaign')
  }, [router])
  return null
}
