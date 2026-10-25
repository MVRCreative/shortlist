'use client'

import { cn } from '@/lib/utils'

const DROP = [
  { company: 'Northline', signal: 'Just raised Series A', title: 'Head of Brand' },
  { company: 'Raster', signal: 'Hiring design lead', title: 'Founder' },
  { company: 'Kiln', signal: 'Launching a product', title: 'CMO' },
  { company: 'Fieldnote', signal: 'New leadership', title: 'VP Marketing' },
  { company: 'Orbit', signal: 'Expanding into US', title: 'Head of Growth' },
  { company: 'Sable', signal: 'Just raised seed', title: 'Co-founder' },
  { company: 'Harbor', signal: 'Hiring brand designer', title: 'CEO' },
  { company: 'Vellum', signal: 'Rebranding', title: 'Head of Marketing' },
  { company: 'Atelier', signal: 'Opening a second office', title: 'Partner' },
  { company: 'Mosaic', signal: 'Hiring creative director', title: 'CEO' },
] as const

function DropRow({
  company,
  title,
  signal,
  index,
}: {
  company: string
  title: string
  signal: string
  index: number
}) {
  return (
    <li className="landing-rolodex-card flex items-baseline justify-between gap-4 border-b border-stroke-soft-200/40 py-4">
      <div className="min-w-0">
        <p className="flex items-baseline gap-3">
          <span className="font-mono text-paragraph-xs tabular-nums text-text-sub-600">
            {String((index % DROP.length) + 1).padStart(2, '0')}
          </span>
          <span className="truncate font-display text-xl font-medium tracking-tight md:text-2xl">
            {company}
          </span>
        </p>
        <p className="truncate pl-9 text-paragraph-xs text-text-sub-600">{title}</p>
      </div>
      <p className="max-w-[40%] shrink-0 truncate text-right text-paragraph-xs text-text-sub-600">
        {signal}
      </p>
    </li>
  )
}

/**
 * Infinite vertical rolodex — CSS transform only, pauses on fine hover,
 * static under prefers-reduced-motion.
 */
export function LandingRolodex({ className }: { className?: string }) {
  const loop = [...DROP, ...DROP]

  return (
    <div className={cn('landing-rolodex relative', className)} aria-hidden="true">
      <p className="mb-4 text-paragraph-xs uppercase tracking-caps text-text-sub-600">This week</p>
      <div className="landing-rolodex-window relative h-[min(62vh,28rem)] overflow-hidden md:h-[min(70vh,34rem)]">
        <ul className="landing-rolodex-track flex flex-col will-change-transform">
          {loop.map((row, i) => (
            <DropRow key={`${row.company}-${i}`} {...row} index={i} />
          ))}
        </ul>
      </div>
    </div>
  )
}
