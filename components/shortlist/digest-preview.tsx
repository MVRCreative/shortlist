import { format } from 'date-fns'
import { Lock, MessageSquareText, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { nextSendDate } from '@/lib/shortlist/schedule'
import { channelLabels, type DigestSettings } from '@/lib/shortlist/schemas'

const VISIBLE_ROWS = 3

// Placeholder copy sits under a blur; only its shape needs to read as real.
const TEASERS = [
  { name: 'Northwind Analytics', domain: 'northwind.io', signal: 'Hired a new VP of Marketing', employees: '51–200' },
  { name: 'Halcyon Health', domain: 'halcyonhealth.com', signal: 'Raised a $24M Series B', employees: '201–500' },
  { name: 'Relay Freight', domain: 'relayfreight.co', signal: 'Launching a new product line', employees: '51–200' },
  { name: 'Brightline Legal', domain: 'brightline.law', signal: 'Website unchanged since 2019', employees: '101–250' },
]

const FALLBACK_INDUSTRIES = ['B2B SaaS', 'Healthcare', 'Logistics', 'Professional services']

function BlurredRow({
  teaser,
  industry,
}: {
  teaser: (typeof TEASERS)[number]
  industry: string
}) {
  return (
    <li className="flex items-start gap-3 py-4 first:pt-0">
      <span className="size-10 shrink-0 rounded-10 bg-bg-soft-200 blur-[2px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2 blur-[5px] select-none">
          <span className="text-label-sm">{teaser.name}</span>
          <span className="text-paragraph-xs">{teaser.domain}</span>
        </div>
        <p className="text-paragraph-xs">
          {industry} · {teaser.employees} employees
        </p>
        <p className="flex items-center gap-1.5 text-paragraph-sm text-text-strong-950">
          <Zap className="size-3 shrink-0" aria-hidden="true" />
          <span className="blur-[4px] select-none">{teaser.signal}</span>
        </p>
      </div>
      <span className="hidden shrink-0 items-center gap-1.5 text-paragraph-xs sm:flex">
        <MessageSquareText className="size-3" aria-hidden="true" />
        LinkedIn note
      </span>
    </li>
  )
}

export function DigestPreview({ settings, industries }: { settings: DigestSettings; industries: string[] }) {
  const pool = industries.length > 0 ? industries : FALLBACK_INDUSTRIES
  const remaining = settings.leadsPerDigest - VISIBLE_ROWS
  const extras = settings.channels.filter((c) => c !== 'linkedinMessage')
  const sendDate = format(nextSendDate(settings.cadence), 'EEEE, MMM d')

  return (
    <section aria-labelledby="digest-preview-label" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="digest-preview-label" className="text-label-sm">
          Your first digest
        </h2>
        <p className="text-paragraph-xs tabular-nums">{sendDate}</p>
      </div>

      <p className="sr-only">
        A preview of your first digest: {settings.leadsPerDigest} accounts matched to your profile, each with a drafted
        LinkedIn note. Account names and signals unlock when you start Shortlist.
      </p>

      <div aria-hidden="true" className="relative">
        <ul className="flex flex-col divide-y">
          {TEASERS.slice(0, VISIBLE_ROWS).map((teaser, i) => (
            <BlurredRow key={teaser.domain} teaser={teaser} industry={pool[i % pool.length]} />
          ))}
        </ul>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-2/3 items-end justify-center bg-gradient-to-b from-transparent via-card/80 to-card pb-2">
          <p className="flex items-center gap-2 rounded-full border border-stroke-soft-200 bg-bg-white-0 px-3 py-1.5 text-paragraph-xs text-text-strong-950">
            <Lock className="size-3" aria-hidden="true" />
            Unlocks when you start Shortlist
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg bg-bg-weak-50 px-4 py-3">
        <p className="text-paragraph-xs tabular-nums" aria-live="polite">
          {remaining > 0
            ? `+ ${remaining} more account${remaining === 1 ? '' : 's'}, each with a personalized LinkedIn note`
            : 'Each account comes with a personalized LinkedIn note'}
        </p>
        {extras.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-paragraph-xs">Plus</span>
            {extras.map((channel) => (
              <Badge key={channel} variant="secondary" className="bg-bg-white-0">
                {channelLabels[channel]}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
