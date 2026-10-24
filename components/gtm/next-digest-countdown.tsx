'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { nextSendDate } from '@/lib/gtm/schedule'
import type { DigestSettings } from '@/lib/gtm/schemas'

function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
  }
}

export function NextDigestCountdown({
  cadence,
  leadsPerDigest,
  email,
}: {
  cadence: DigestSettings['cadence']
  leadsPerDigest: number
  email: string
}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const target = nextSendDate(cadence, now)
  const { days, hours, minutes } = splitDuration(target.getTime() - now.getTime())
  const remaining = days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`

  return (
    <p className="text-meta text-pretty">
      Next {leadsPerDigest} accounts in{' '}
      <time dateTime={target.toISOString()} className="font-medium text-foreground tabular-nums">
        {remaining}
      </time>
      {' · '}
      {format(target, 'EEE, MMM d, h:mm a')}
      {email ? ` to ${email}` : ''}
    </p>
  )
}
