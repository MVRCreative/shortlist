import { Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CompleteButton } from '@/components/gtm/complete-button'
import { CopyButton } from '@/components/gtm/copy-button'
import type { Digest } from '@/lib/gtm/schemas'
import { cn } from '@/lib/utils'

type Lead = Digest['leads'][number]

function LeadItem({
  lead,
  index,
  done,
  showMessage,
  onToggle,
}: {
  lead: Lead
  index: number
  done: boolean
  showMessage: boolean
  onToggle: () => void
}) {
  return (
    <li className="flex gap-4 px-5 py-5">
      <span className="w-5 shrink-0 pt-0.5 text-meta tabular" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className={cn('flex min-w-0 flex-col gap-1 transition-opacity', done && 'opacity-60')}>
            <p className={cn('text-label', done && 'line-through decoration-muted-foreground')}>
              {lead.contactName}
              <span className="font-normal text-muted-foreground"> · {lead.title}</span>
            </p>
            <p className="text-meta">
              {lead.company} · {lead.domain}
            </p>
          </div>
          <CompleteButton done={done} onToggle={onToggle} label={lead.contactName} />
        </div>

        {done ? null : (
          <>
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-1.5 text-body text-foreground">
                <Zap className="size-icon-xs shrink-0" aria-hidden="true" />
                {lead.signal}
              </p>
              <p className="text-description text-pretty">{lead.angle}</p>
            </div>

            {showMessage ? (
              <div className="flex flex-col gap-2 rounded-xl bg-muted px-4 pt-3 pb-2">
                <p className="text-meta">Personalized message</p>
                <p className="whitespace-pre-line text-body text-pretty">{lead.message}</p>
                <div className="-mr-2 flex justify-end">
                  <CopyButton text={lead.message} label="Copy message" />
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </li>
  )
}

export function LeadListSkeleton({ rows }: { rows: number }) {
  return (
    <Card className="gap-0 py-0" aria-busy="true" aria-label="Loading leads">
      {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 border-b border-border px-5 py-5 last:border-0">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ))}
    </Card>
  )
}

export function LeadList({
  leads,
  completed,
  showMessages,
  onToggle,
}: {
  leads: Lead[]
  completed: Set<string>
  showMessages: boolean
  onToggle: (key: string) => void
}) {
  return (
    <Card className="gap-0 py-0">
      <ol className="divide-y divide-border">
        {leads.map((lead, i) => {
          const key = `lead-${i}`
          return (
            <LeadItem
              key={key}
              lead={lead}
              index={i}
              done={completed.has(key)}
              showMessage={showMessages}
              onToggle={() => onToggle(key)}
            />
          )
        })}
      </ol>
    </Card>
  )
}
