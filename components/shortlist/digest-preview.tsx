import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { nextSendDate } from '@/lib/shortlist/schedule'
import { channelLabels, type DigestSettings } from '@/lib/shortlist/schemas'

export function DigestPreview({ settings }: { settings: DigestSettings }) {
  const count = Math.min(settings.leadsPerDigest, 10)
  const extras = settings.channels.filter((channel) => channel !== 'linkedinMessage')
  const sendDate = format(nextSendDate(settings.cadence), 'EEEE, MMM d')

  return (
    <section aria-labelledby="digest-preview-label" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="digest-preview-label" className="text-label-sm">
          Your first digest
        </h2>
        <p className="text-paragraph-xs tabular-nums">{sendDate}</p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-bg-weak-50 px-4 py-3">
        <p className="text-paragraph-sm text-text-strong-950">
          Shortlist finds {count} new {count === 1 ? 'account' : 'accounts'} that were not in your calibration list,
          then adds a decision-maker and suggested messaging.
        </p>
        <p className="text-paragraph-xs">
          Incomplete accounts are left out. Unverified emails are omitted. If fewer accounts qualify, the drop is
          shorter and says so.
        </p>
        {extras.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-paragraph-xs">Also included</span>
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
