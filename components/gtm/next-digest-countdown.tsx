'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Clock } from 'lucide-react'
import { nextSendDate } from '@/lib/gtm/schedule'
import type { DigestSettings } from '@/lib/gtm/schemas'

function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

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
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const target = nextSendDate(cadence, now)
  const { days, hours, minutes, seconds } = splitDuration(target.getTime() - now.getTime())
  const units = [
    { value: days, label: 'd' },
    { value: hours, label: 'h' },
    { value: minutes, label: 'm' },
    { value: seconds, label: 's' },
  ]

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex size-control-sm shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
          <Clock className="size-icon-sm" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <p className="text-label">Next {leadsPerDigest} accounts drop</p>
          <p className="text-meta">
            {format(target, 'EEE, MMM d · h:mm a')}
            {email ? ` → ${email}` : ''}
          </p>
        </div>
      </div>
      <p className="flex items-baseline gap-1 tabular" role="timer" aria-live="off" aria-label={`Next digest in ${days} days ${hours} hours ${minutes} minutes`}>
        {units.map((unit) => (
          <span key={unit.label} className="flex items-baseline">
            <span className="text-label">{unit.label === 'd' ? unit.value : pad(unit.value)}</span>
            <span className="text-meta">{unit.label}</span>
          </span>
        ))}
      </p>
    </div>
  )
}
